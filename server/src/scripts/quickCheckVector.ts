import connectDB from '../config/db.ts';
import { Prescription } from '../models/Prescription.ts';

await connectDB();

const doc = await Prescription.findOne({ 
  healthSummaryVector: { $exists: true, $ne: [] } 
}).lean();

console.log(doc ? doc.healthSummaryVector.length : 'no doc');
process.exit(0);
