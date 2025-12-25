import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve .env reliably whether the server is started from repo root or /server
const candidateEnvPaths = [
  process.env.ENV_FILE && path.resolve(process.env.ENV_FILE),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
].filter(Boolean) as string[];

const envPath = candidateEnvPaths.find((p) => fs.existsSync(p));

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// Accept either GEMINI_API_KEY or GOOGLE_API_KEY to avoid naming drift
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// Optional OpenAI key for TTS
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Allow overriding Gemini model; default to gemini-2.5-flash since you have access
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in environment variables.');
}

if (!/^AIza/.test(GEMINI_API_KEY)) {
  console.warn('GEMINI_API_KEY does not look like a Google AI key (expected to start with AIza...).');
}

// Authentication & Session Configuration
const SESSION_SECRET = process.env.SESSION_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Email Configuration for OTP
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

// Server Port
const PORT = process.env.PORT || 5000;

// Frontend URL for CORS
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Razorpay Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Validation
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not set in environment variables.');
}

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('⚠️  EMAIL_USER or EMAIL_PASS not set. Password reset functionality will not work.');
}

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not set. Using default connection from db.ts');
}

export { 
  GEMINI_API_KEY, 
  GEMINI_MODEL,
  OPENAI_API_KEY,
  SESSION_SECRET,
  NODE_ENV,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_HOST,
  EMAIL_PORT,
  MONGODB_URI,
  PORT,
  FRONTEND_URL,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET
};