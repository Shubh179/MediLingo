import mongoose from 'mongoose';
import { Prescription } from '../models/Prescription';
import { MedicalHistory } from '../models/MedicalHistory';

// Update this with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medilingo';

async function checkUserData(userId: string) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Check prescriptions
    const prescriptions = await Prescription.find({ userId: userObjectId });
    console.log(`\n=== USER ${userId} ===`);
    console.log(`Total Prescriptions: ${prescriptions.length}`);
    
    prescriptions.forEach((p, idx) => {
      console.log(`\nPrescription ${idx + 1}:`);
      console.log(`  Doctor: ${p.doctorName || 'N/A'}`);
      console.log(`  Scanned: ${p.scannedAt}`);
      console.log(`  Medications: ${p.medications.length}`);
      console.log(`  Has Vector: ${p.healthSummaryVector ? 'Yes' : 'No'}`);
      if (p.healthSummaryVector) {
        console.log(`  Vector Length: ${p.healthSummaryVector.length}`);
      }
      console.log(`  Medications:`);
      p.medications.forEach(m => {
        console.log(`    - ${m.name} (${m.dosage}, ${m.frequency})`);
      });
    });

    // Check medical history
    const history = await MedicalHistory.findOne({ userId: userObjectId });
    console.log(`\n=== MEDICAL HISTORY ===`);
    if (history) {
      console.log(`Chronic Conditions: ${history.chronicConditions.join(', ') || 'None'}`);
      console.log(`Active Medications: ${history.activeMedications.length}`);
      history.activeMedications.forEach(m => {
        console.log(`  - ${m.name} (prescribed: ${m.prescribedDate})`);
      });
    } else {
      console.log('No medical history found');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get userId from command line argument
const userId = process.argv[2] || '507f1f77bcf86cd799439012';
checkUserData(userId);
