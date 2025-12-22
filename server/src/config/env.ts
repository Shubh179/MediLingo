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

// Allow overriding Gemini model; default to gemini-2.5-flash since you have access
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in environment variables.');
}

if (!/^AIza/.test(GEMINI_API_KEY)) {
  console.warn('GEMINI_API_KEY does not look like a Google AI key (expected to start with AIza...).');
}

export { GEMINI_API_KEY, GEMINI_MODEL };
