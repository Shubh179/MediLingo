import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MedicalKnowledge } from '../models/MedicalKnowledge';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const BATCH_SIZE = 100;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

async function importCSV(csvFilePath: string) {
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected to MongoDB');

  const records: any[] = [];
  let count = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          // Extract vector columns (vector_0 to vector_383)
          const vector: number[] = [];
          for (let i = 0; i < 384; i++) {
            const val = parseFloat(row[`vector_${i}`]);
            if (!isNaN(val)) {
              vector.push(val);
            }
          }

          // Only process if we have a complete 384-D vector
          if (vector.length === 384) {
            const record = {
              disease: row['Disease Prediction'] || row.Disease || row.disease || '',
              symptoms: row['Symptoms/Question'] ? row['Symptoms/Question'].split(',').map((s: string) => s.trim()) : [],
              remedy: row['Recommended Medicines'] || row.Recommend || row.Advice || row.remedy || '',
              precautions: row.Advice ? row.Advice.split(',').map((p: string) => p.trim()) : [],
              severity: row.Severity_Score || row.Severity_S || row.severity || '',
              healthSummaryVector: vector,
              text_to_embed: row.text_to_embed || ''
            };

            records.push(record);
            count++;

            // Batch insert every BATCH_SIZE records
            if (records.length >= BATCH_SIZE) {
              const batch = records.splice(0, BATCH_SIZE);
              MedicalKnowledge.insertMany(batch, { ordered: false })
                .then(() => console.log(`Inserted batch, total: ${count}`))
                .catch(err => console.error('Batch insert error:', err.message));
            }
          }
        } catch (error) {
          console.error('Error processing row:', error);
        }
      })
      .on('end', async () => {
        // Insert remaining records
        if (records.length > 0) {
          try {
            await MedicalKnowledge.insertMany(records, { ordered: false });
            console.log(`Inserted final batch, total: ${count}`);
          } catch (error) {
            console.error('Final batch error:', error);
          }
        }

        console.log(`\n✅ Import complete! Total records: ${count}`);
        await mongoose.disconnect();
        resolve();
      })
      .on('error', (error) => {
        console.error('CSV read error:', error);
        reject(error);
      });
  });
}

// Usage: npx tsx ./src/scripts/importMedicalData.ts <path-to-csv>
const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Usage: npx tsx ./src/scripts/importMedicalData.ts <csv-file-path>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`);
  process.exit(1);
}

importCSV(csvPath).catch(async (err) => {
  console.error('Import failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
