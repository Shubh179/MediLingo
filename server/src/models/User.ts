import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string; // MongoDB's default 24-character hex ObjectId
  name: string;
  email: string;
  password: string;
  age: number;
  gender?: 'Male' | 'Female';
  sharingCode?: string; // 8-char alphanumeric code for sharing access (female users only)
  sharedAccessList?: string[]; // List of female user IDs this user can access (typically male users)
  languagePreference: string;
  tier: 'Free' | 'Premium';
  otpCode?: string;
  otpExpires?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  age: {
    type: Number,
    required: true,
    min: [1, 'Age must be at least 1'],
    max: [150, 'Age must be less than 150']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    default: undefined
  },
  sharingCode: { type: String, unique: true, sparse: true },
  // Many-to-many access: male users can have access to multiple female users
  sharedAccessList: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  languagePreference: { type: String, default: 'English' },
  tier: { type: String, enum: ['Free', 'Premium'], default: 'Free' },
  otpCode: { type: String },
  otpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Helper to generate a random 8-character alphanumeric code
function generateSharingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Auto-generate sharingCode for Female users if missing
userSchema.pre('save', async function (next) {
  // Only generate for female users and when code not already set
  if (this.gender === 'Female' && !this.sharingCode) {
    // Attempt to generate a unique code; retry a few times on collision
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateSharingCode();
      // @ts-ignore
      const existing = await (this.constructor as any).findOne({ sharingCode: code });
      if (!existing) {
        this.sharingCode = code;
        break;
      }
    }
  }
  next();
});

export const User = model<IUser>('User', userSchema);