import { Schema, model, Document, Types } from 'mongoose';

export interface ISymptomLog {
  date: Date;
  symptoms: string[];
  notes?: string;
}

export interface IMenstrualCycle extends Document {
  user: Types.ObjectId;
  settings: {
    periodDuration: number; // days
    cycleLength: number; // days
    lastPeriodStart: Date | null;
  };
  symptomLogs: ISymptomLog[];
  createdAt: Date;
  updatedAt: Date;
}

const symptomLogSchema = new Schema<ISymptomLog>({
  date: { type: Date, required: true },
  symptoms: { type: [String], default: [] },
  notes: { type: String },
});

const menstrualCycleSchema = new Schema<IMenstrualCycle>({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true },
  settings: {
    periodDuration: { type: Number, default: 5, min: 1, max: 15 },
    cycleLength: { type: Number, default: 28, min: 18, max: 45 },
    lastPeriodStart: { type: Date, default: null },
  },
  symptomLogs: { type: [symptomLogSchema], default: [] },
}, { timestamps: true });

export const MenstrualCycle = model<IMenstrualCycle>('MenstrualCycle', menstrualCycleSchema);
