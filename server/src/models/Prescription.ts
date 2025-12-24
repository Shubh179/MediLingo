import { Schema, model, Document, Types } from 'mongoose';

interface IMedication {
  name: string;
  dosage: string;
  frequency: string; // e.g., "1-0-1"
  simpleInstruction: string; // "After lunch"
  localInstruction: string; // "दुपारच्या जेवणानंतर"
}

export interface IPrescription extends Document {
  userId: Types.ObjectId;
  doctorName: string;
  rawText: string;
  medications: IMedication[];
  scannedAt: Date;
  healthSummaryVector?: number[];
}

const prescriptionSchema = new Schema<IPrescription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String },
  rawText: { type: String, required: true },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    simpleInstruction: String,
    localInstruction: String
  }],
  scannedAt: { type: Date, default: Date.now },
  healthSummaryVector: { type: [Number], default: [] }
});

export const Prescription = model<IPrescription>('Prescription', prescriptionSchema);