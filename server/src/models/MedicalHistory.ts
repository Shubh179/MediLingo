import mongoose, { Schema } from 'mongoose';
import { MedicalHistoryDocument } from '../types/index.js';

const MedicalHistorySchema = new Schema<MedicalHistoryDocument>({
  userId: { 
    type: String, 
    required: true,
    index: true,
  },
  prescriptionId: { 
    type: String, 
    required: true,
    index: true,
  },
  visitDate: { 
    type: Date, 
    required: true,
    index: true,
  },
  diagnosis: { 
    type: String, 
    required: true,
  },
  prescribingPhysician: { 
    type: String, 
    required: true,
  },
  facilityName: { 
    type: String, 
    required: true,
  },
  notes: { 
    type: String, 
    default: '',
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
MedicalHistorySchema.index({ userId: 1, visitDate: -1 });
MedicalHistorySchema.index({ prescriptionId: 1 });
MedicalHistorySchema.index({ userId: 1, createdAt: -1 });

export const MedicalHistory = mongoose.model<MedicalHistoryDocument>('MedicalHistory', MedicalHistorySchema);