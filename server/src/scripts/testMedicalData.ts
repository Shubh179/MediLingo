import connectDB from '../config/db.ts';
import { MedicalKnowledge } from '../models/MedicalKnowledge.ts';

await connectDB();

const count = await MedicalKnowledge.countDocuments();
console.log(`Total documents: ${count}`);

const sample = await MedicalKnowledge.findOne({ healthSummaryVector: { $exists: true } }).lean();
console.log('Sample document:');
console.log({
  disease: sample?.disease,
  remedy: sample?.remedy?.substring(0, 100),
  vectorLength: sample?.healthSummaryVector?.length
});

// Check if we can do a simple query
const testDoc = await MedicalKnowledge.findOne({ disease: /diabetes/i }).lean();
console.log('\nDiabetes document found:', testDoc ? 'Yes' : 'No');

process.exit(0);
