import mongoose, { Schema, Document } from 'mongoose';
import { UserDocument } from '../types/index.js';

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
});

const UserPreferencesSchema = new Schema({
  language: { type: String, default: 'en' },
  notifications: {
    medication: { type: Boolean, default: true },
    appointments: { type: Boolean, default: true },
    emergencies: { type: Boolean, default: true },
  },
  privacy: {
    shareDataForResearch: { type: Boolean, default: false },
    allowLocationTracking: { type: Boolean, default: true },
  },
});

const UserSchema = new Schema<UserDocument>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { 
    type: String, 
    required: true,
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true,
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true,
  },
  dateOfBirth: { 
    type: Date, 
    required: true,
  },
  allergies: [{ 
    type: String,
    trim: true,
  }],
  chronicConditions: [{ 
    type: String,
    trim: true,
  }],
  emergencyContact: {
    type: EmergencyContactSchema,
    required: true,
  },
  preferences: {
    type: UserPreferencesSchema,
    default: () => ({}),
  },
  refreshTokens: [{
    type: String,
  }],
  lastLogin: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.refreshTokens;
      return ret;
    }
  }
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isActive: 1 });

export const User = mongoose.model<UserDocument>('User', UserSchema);