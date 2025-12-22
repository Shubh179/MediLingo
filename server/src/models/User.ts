import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  languagePreference: string;
  tier: 'Free' | 'Premium';
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  languagePreference: { type: String, default: 'English' },
  tier: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', userSchema);