// Core data types for the Medical Assistant System

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface UserPreferences {
  language: string;
  notifications: {
    medication: boolean;
    appointments: boolean;
    emergencies: boolean;
  };
  privacy: {
    shareDataForResearch: boolean;
    allowLocationTracking: boolean;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: EmergencyContact;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationData {
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescribedBy: string;
  prescriptionDate: Date;
  refills: number;
  ndc: string; // National Drug Code
  confidence: number;
}

export interface ExtractedText {
  rawText: string;
  confidence: number;
  boundingBoxes?: Array<{
    text: string;
    confidence: number;
    geometry: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ProcessedPrescription {
  id: string;
  userId: string;
  medications: MedicationData[];
  extractedText: string;
  confidence: number;
  processedAt: Date;
  originalImageUrl?: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface MedicationPatterns {
  recurringMedications: Array<{
    medication: string;
    frequency: number;
    lastPrescribed: Date;
  }>;
  treatmentTrends: Array<{
    condition: string;
    medications: string[];
    duration: number;
  }>;
  adherenceScore: number;
}

export interface AdherenceMetrics {
  overallScore: number;
  medicationSpecific: Array<{
    medication: string;
    adherenceRate: number;
    missedDoses: number;
    lastTaken?: Date;
  }>;
  trends: Array<{
    date: Date;
    score: number;
  }>;
}

export interface MedicationHistory {
  userId: string;
  prescriptions: ProcessedPrescription[];
  totalMedications: number;
  dateRange: DateRange;
  patterns: MedicationPatterns;
}

export interface MedicalHistoryEntry {
  id: string;
  userId: string;
  prescriptionId: string;
  medications: MedicationData[];
  symptoms: string[];
  diagnosis: string;
  prescribingPhysician: string;
  facilityName: string;
  visitDate: Date;
  notes: string;
  attachments: string[];
}

export interface Recommendation {
  type: 'medication' | 'lifestyle' | 'consultation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
  sources: string[];
}

export interface InteractionWarning {
  severity: 'mild' | 'moderate' | 'severe';
  medications: string[];
  description: string;
  recommendation: string;
  sources: string[];
}

export interface MedicationInfo {
  name: string;
  genericName: string;
  description: string;
  sideEffects: string[];
  interactions: string[];
  contraindications: string[];
  dosageInstructions: string;
  warnings: string[];
  sources: string[];
}

export interface ChatResponse {
  message: string;
  type: 'information' | 'recommendation' | 'warning' | 'emergency';
  context?: {
    relatedMedications?: string[];
    recommendations?: Recommendation[];
    warnings?: InteractionWarning[];
  };
  requiresProfessionalConsultation: boolean;
}

export interface OperatingHours {
  monday: { open: string; close: string; closed?: boolean };
  tuesday: { open: string; close: string; closed?: boolean };
  wednesday: { open: string; close: string; closed?: boolean };
  thursday: { open: string; close: string; closed?: boolean };
  friday: { open: string; close: string; closed?: boolean };
  saturday: { open: string; close: string; closed?: boolean };
  sunday: { open: string; close: string; closed?: boolean };
}

export interface MedicalFacility {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  phone: string;
  hours: OperatingHours;
  distance: number;
  rating: number;
}

export interface Pharmacy extends MedicalFacility {
  type: 'pharmacy';
  services: string[];
  acceptedInsurance: string[];
  hasDelivery: boolean;
}

export interface Hospital extends MedicalFacility {
  type: 'hospital';
  specialties: string[];
  emergencyServices: boolean;
  level: 'I' | 'II' | 'III' | 'IV';
}

// Service Interfaces
export interface PrescriptionProcessor {
  processImage(imageBuffer: Buffer, userId: string): Promise<ProcessedPrescription>;
  extractText(imageBuffer: Buffer): Promise<ExtractedText>;
  structureData(rawText: string): Promise<MedicationData[]>;
  validateMedications(medications: MedicationData[]): Promise<ValidationResult>;
}

export interface HistoryManager {
  storePrescription(prescription: ProcessedPrescription): Promise<void>;
  getUserHistory(userId: string): Promise<MedicationHistory>;
  analyzePatterns(userId: string): Promise<MedicationPatterns>;
  getAdherenceData(userId: string): Promise<AdherenceMetrics>;
}

export interface MedicalAssistant {
  generateRecommendations(userId: string, context: string): Promise<Recommendation[]>;
  answerQuery(query: string, userHistory: MedicationHistory): Promise<ChatResponse>;
  checkInteractions(medications: MedicationData[]): Promise<InteractionWarning[]>;
  provideMedicationInfo(medicationName: string): Promise<MedicationInfo>;
}

export interface LocationService {
  findNearbyPharmacies(location: Coordinates, radius: number): Promise<Pharmacy[]>;
  findNearbyHospitals(location: Coordinates, radius: number): Promise<Hospital[]>;
  getLocationFromAddress(address: string): Promise<Coordinates>;
  calculateDistance(from: Coordinates, to: Coordinates): number;
}

// API Request/Response types
export interface UploadPrescriptionRequest {
  userId: string;
  imageData: string; // base64 encoded image
  imageFormat: 'jpeg' | 'png' | 'pdf';
}

export interface UploadPrescriptionResponse {
  success: boolean;
  prescriptionId?: string;
  error?: string;
}

export interface GetHistoryRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetHistoryResponse {
  success: boolean;
  history?: MedicationHistory;
  error?: string;
}

export interface ChatRequest {
  userId: string;
  message: string;
  context?: {
    conversationId?: string;
    previousMessages?: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
  };
}

export interface ChatResponseAPI {
  success: boolean;
  response?: ChatResponse;
  conversationId?: string;
  error?: string;
}

export interface LocationSearchRequest {
  coordinates: Coordinates;
  radius: number; // in kilometers
  type: 'pharmacy' | 'hospital';
  specialties?: string[];
}

export interface LocationSearchResponse {
  success: boolean;
  facilities?: (Pharmacy | Hospital)[];
  error?: string;
}

// Database schema interfaces
export interface UserDocument extends UserProfile {
  passwordHash: string;
  refreshTokens: string[];
  lastLogin?: Date;
  isActive: boolean;
}

export interface PrescriptionDocument {
  _id: string;
  userId: string;
  originalImageUrl?: string;
  extractedText: string;
  processedData: MedicationData[];
  confidenceScore: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationDocument {
  _id: string;
  prescriptionId: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  ndcCode: string;
  createdAt: Date;
}

export interface MedicalHistoryDocument {
  _id: string;
  userId: string;
  prescriptionId: string;
  visitDate: Date;
  diagnosis: string;
  prescribingPhysician: string;
  facilityName: string;
  notes: string;
  createdAt: Date;
}

// Authentication types
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<UserProfile, 'emergencyContact' | 'preferences'>;
  tokens?: AuthToken;
  error?: string;
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ServiceError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}

// Health check types
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  timestamp: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: Date;
}