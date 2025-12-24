import connectDB from '../config/db.ts';
import { MedicalKnowledge } from '../models/MedicalKnowledge.ts';

await connectDB();

// Check a few sample records
const samples = await MedicalKnowledge.find()
  .limit(5)
  .lean();

console.log('Sample records:');
samples.forEach((doc: any, i: number) => {
  console.log(`\n${i + 1}. Disease: ${doc.disease}`);
  console.log(`   Remedy: ${doc.remedy?.substring(0, 100)}`);
  console.log(`   Precautions: ${Array.isArray(doc.precautions) ? doc.precautions : 'Not an array'}`);
  console.log(`   Vector length: ${doc.healthSummaryVector?.length}`);
});

process.exit(0);
