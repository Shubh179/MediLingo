import mongoose, { Schema } from 'mongoose';
import { PrescriptionDocument } from '../types/index.js';

const MedicationDataSchema = new Schema({
  name: { type: String, required: true },
  genericName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: '' },
  prescribedBy: { type: String, default: '' },
  prescriptionDate: { type: Date, required: true },
  refills: { type: Number, default: 0 },
  ndc: { type: String, default: '' },
  confidence: { type: Number, required: true, min: 0, max: 1 },
}, { _id: false });

const PrescriptionSchema = new Schema<PrescriptionDocument>({
  userId: { 
    type: String, 
    required: true,
    index: true,
  },
  originalImageUrl: { 
    type: String,
  },
  extractedText: { 
    type: String, 
    required: true,
  },
  processedData: [MedicationDataSchema],
  confidenceScore: { 
    type: Number, 
    required: true,
    min: 0,
    max: 1,
  },
  status: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
    index: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
PrescriptionSchema.index({ userId: 1, createdAt: -1 });
PrescriptionSchema.index({ status: 1, createdAt: -1 });
PrescriptionSchema.index({ userId: 1, status: 1 });

export const Prescription = mongoose.model<PrescriptionDocument>('Prescription', PrescriptionSchema);