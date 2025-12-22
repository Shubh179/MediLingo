import { config } from 'dotenv';

// Load environment variables
config();

export interface EnvironmentConfig {
  // Server configuration
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  
  // Database configuration
  MONGODB_URI: string;
  
  // JWT configuration
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // AWS configuration
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET_NAME: string;
  BEDROCK_MODEL_ID: string;
  
  // Encryption configuration
  ENCRYPTION_KEY: string;
  
  // External APIs
  GOOGLE_MAPS_API_KEY?: string;
  
  // Logging
  LOG_LEVEL: string;
}

// Default values
const defaults: Partial<EnvironmentConfig> = {
  NODE_ENV: 'development',
  PORT: 3001,
  HOST: '0.0.0.0',
  MONGODB_URI: 'mongodb://localhost:27017/medical-assistant',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  AWS_REGION: 'us-east-1',
  BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
  LOG_LEVEL: 'info',
};

// Required environment variables
const requiredVars: (keyof EnvironmentConfig)[] = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'ENCRYPTION_KEY',
];

// Development-only required variables
const devRequiredVars: (keyof EnvironmentConfig)[] = [];

// Production-only required variables
const prodRequiredVars: (keyof EnvironmentConfig)[] = [
  'GOOGLE_MAPS_API_KEY',
];

export function validateEnvironment(): {
  isValid: boolean;
  config: EnvironmentConfig;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Build configuration with defaults
  const config: EnvironmentConfig = {
    NODE_ENV: process.env.NODE_ENV || defaults.NODE_ENV!,
    PORT: parseInt(process.env.PORT || defaults.PORT!.toString(), 10),
    HOST: process.env.HOST || defaults.HOST!,
    MONGODB_URI: process.env.MONGODB_URI || defaults.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || defaults.JWT_EXPIRES_IN!,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || defaults.JWT_REFRESH_EXPIRES_IN!,
    AWS_REGION: process.env.AWS_REGION || defaults.AWS_REGION!,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
    BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || defaults.BEDROCK_MODEL_ID!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL || defaults.LOG_LEVEL!,
  };
  
  // Validate required variables
  for (const varName of requiredVars) {
    if (!config[varName]) {
      errors.push(`${varName} is required but not set`);
    }
  }
  
  // Environment-specific validation
  if (config.NODE_ENV === 'production') {
    for (const varName of prodRequiredVars) {
      if (!config[varName]) {
        errors.push(`${varName} is required in production but not set`);
      }
    }
    
    // Production-specific warnings
    if (config.JWT_SECRET === 'your-secret-key-change-in-production') {
      errors.push('JWT_SECRET must be changed from default value in production');
    }
    
    if (config.JWT_REFRESH_SECRET === 'your-refresh-secret-key-change-in-production') {
      errors.push('JWT_REFRESH_SECRET must be changed from default value in production');
    }
  } else {
    // Development warnings
    if (!config.JWT_SECRET) {
      warnings.push('JWT_SECRET not set, using default (not secure)');
    }
    
    if (!config.JWT_REFRESH_SECRET) {
      warnings.push('JWT_REFRESH_SECRET not set, using default (not secure)');
    }
    
    if (!config.GOOGLE_MAPS_API_KEY) {
      warnings.push('GOOGLE_MAPS_API_KEY not set, location services will be limited');
    }
  }
  
  // Validate PORT
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }
  
  // Validate LOG_LEVEL
  const validLogLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLogLevels.includes(config.LOG_LEVEL)) {
    warnings.push(`LOG_LEVEL '${config.LOG_LEVEL}' is not recognized, using 'info'`);
    config.LOG_LEVEL = 'info';
  }
  
  // Validate JWT expiration times
  const timeRegex = /^\d+[smhd]$/;
  if (!timeRegex.test(config.JWT_EXPIRES_IN)) {
    warnings.push(`JWT_EXPIRES_IN '${config.JWT_EXPIRES_IN}' format may be invalid`);
  }
  
  if (!timeRegex.test(config.JWT_REFRESH_EXPIRES_IN)) {
    warnings.push(`JWT_REFRESH_EXPIRES_IN '${config.JWT_REFRESH_EXPIRES_IN}' format may be invalid`);
  }
  
  return {
    isValid: errors.length === 0,
    config,
    errors,
    warnings,
  };
}

// Validate and export configuration
const validation = validateEnvironment();

if (!validation.isValid) {
  console.error('Environment validation failed:');
  validation.errors.forEach(error => console.error(`  ❌ ${error}`));
  process.exit(1);
}

if (validation.warnings.length > 0) {
  console.warn('Environment validation warnings:');
  validation.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
}

export const env = validation.config;

// Helper functions
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}