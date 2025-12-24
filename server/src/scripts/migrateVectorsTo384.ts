import dotenv from 'dotenv';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import mongoose from 'mongoose';
import path from 'path';
import { Prescription } from '../models/Prescription';

// Load env (works when invoked via ts-node/tsx)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TARGET_DIM = 384;
const BATCH_SIZE = 20;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function migrate() {
  await connect();

  const cursor = Prescription.find({}, { rawText: 1, healthSummaryVector: 1 }).cursor();
  let processed = 0;
  let updated = 0;

  const pending: Promise<void>[] = [];

  for await (const doc of cursor) {
    const currentLen = Array.isArray(doc.healthSummaryVector) ? doc.healthSummaryVector.length : 0;
    if (currentLen === TARGET_DIM) {
      processed++;
      continue;
    }

    pending.push((async () => {
      const text = doc.rawText || '';
      if (!text.trim()) return;

      const embeddingResult = await embeddingModel.embedContent({
        content: { role: 'user', parts: [{ text }] },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        outputDimensionality: TARGET_DIM,
      });
      const vector = embeddingResult.embedding.values;
      doc.healthSummaryVector = vector;
      await doc.save();
      updated++;
      console.log(`Updated ${doc._id} -> len ${vector.length}`);
    })());

    // Throttle batches
    if (pending.length >= BATCH_SIZE) {
      await Promise.all(pending.splice(0));
    }
    processed++;
  }

  if (pending.length) {
    await Promise.all(pending);
  }

  console.log(`Done. Processed: ${processed}, Updated: ${updated}`);
  await mongoose.disconnect();
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
