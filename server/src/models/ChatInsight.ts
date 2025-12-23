import mongoose from 'mongoose';

const ChatInsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  keywords: [{ type: String }], // e.g., ["dizziness", "low blood sugar"]
  summary: { type: String },    // A 1-sentence medical summary
  timestamp: { type: Date, default: Date.now }
});

export const ChatInsight = mongoose.model('ChatInsight', ChatInsightSchema);