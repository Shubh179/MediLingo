import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('JWT secrets not set in environment variables. Using default values (NOT SECURE FOR PRODUCTION)');
}

// Authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false, 
        error: 'Token expired' 
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ 
        success: false, 
        error: 'Invalid token' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Token verification failed' 
      });
    }
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
  } catch (error) {
    // Silently ignore token errors for optional auth
    console.warn('Optional auth token verification failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  next();
};

// Generate access token
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: process.env.JWT_EXPIRES_IN || '15m' 
  });
};

// Generate refresh token
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' 
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};

// Rate limiting middleware for authentication endpoints
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const attempts = authAttempts.get(clientId);
    
    if (attempts) {
      // Reset counter if window has passed
      if (now - attempts.lastAttempt > windowMs) {
        authAttempts.set(clientId, { count: 1, lastAttempt: now });
      } else if (attempts.count >= maxAttempts) {
        res.status(429).json({
          success: false,
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter: Math.ceil((attempts.lastAttempt + windowMs - now) / 1000)
        });
        return;
      } else {
        attempts.count++;
        attempts.lastAttempt = now;
      }
    } else {
      authAttempts.set(clientId, { count: 1, lastAttempt: now });
    }
    
    next();
  };
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  for (const [clientId, attempts] of authAttempts.entries()) {
    if (now - attempts.lastAttempt > windowMs) {
      authAttempts.delete(clientId);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes