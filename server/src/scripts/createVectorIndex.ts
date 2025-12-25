import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function createVectorIndex() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection');

    // Create Atlas Vector Search index
    const indexDefinition = {
      name: 'vector_index',
      type: 'vectorSearch',
      definition: {
        fields: [
          {
            type: 'vector',
            path: 'healthSummaryVector',
            similarity: 'cosine',
            numDimensions: 384
          },
          {
            type: 'filter',
            path: 'disease'
          }
        ]
      }
    };

    try {
      const result = await db
        .collection('medicalknowledges')
        .createSearchIndex(indexDefinition);
      console.log(`✅ Vector search index created: ${result}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️ Vector search index already exists');
      } else {
        throw error;
      }
    }

    console.log('✅ Vector index setup complete for 20 unique diseases');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', (error as any)?.message);
    process.exit(1);
  }
}

createVectorIndex();
