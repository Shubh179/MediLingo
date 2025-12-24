import { Schema, model, Document } from 'mongoose';

export interface IMedicalKnowledge extends Document {
  disease: string;
  symptoms: string[];
  remedy: string;
  precautions: string[];
  severity: string;
  healthSummaryVector: number[];
  text_to_embed?: string; // The combined text used for embedding
}

const medicalKnowledgeSchema = new Schema<IMedicalKnowledge>({
  disease: { type: String, required: true },
  symptoms: { type: [String], default: [] },
  remedy: { type: String, required: true },
  precautions: { type: [String], default: [] },
  severity: { type: String },
  healthSummaryVector: { type: [Number], required: true },
  text_to_embed: { type: String }
});

// Add vector search index (configured in Atlas)
medicalKnowledgeSchema.index({ healthSummaryVector: '2dsphere' });

export const MedicalKnowledge = model<IMedicalKnowledge>('MedicalKnowledge', medicalKnowledgeSchema);
