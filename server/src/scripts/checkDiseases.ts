import connectDB from '../config/db.ts';
import { MedicalKnowledge } from '../models/MedicalKnowledge.ts';

await connectDB();

// Look for fever-related records
const feverDocs = await MedicalKnowledge.find({
  disease: /fever|cold|flu|infection|viral/i
}, { disease: 1, remedy: 1 }).limit(10).lean();

console.log('Fever-related diseases in database:');
feverDocs.forEach((doc: any) => {
  console.log(`- ${doc.disease}`);
});

console.log(`\nTotal count: ${feverDocs.length}`);

// Also check all unique diseases
const allDiseases = await MedicalKnowledge.distinct('disease');
console.log(`\nTotal unique diseases: ${allDiseases.length}`);
console.log('Sample diseases:', allDiseases.slice(0, 20));

process.exit(0);
