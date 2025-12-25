/**
 * Severity Scoring Utility
 * Maps diseases to severity scores (1-10)
 */

// Critical conditions (9-10)
const CRITICAL_DISEASES = [
  'heart attack', 'stroke', 'sepsis', 'cardiac arrest', 'pulmonary embolism',
  'myocardial infarction', 'acute coronary syndrome', 'acute respiratory distress',
  'severe anaphylaxis', 'hemorrhagic shock', 'meningitis', 'encephalitis',
  'acute kidney failure', 'acute liver failure', 'poisoning', 'severe trauma'
];

// High severity (7-8)
const HIGH_SEVERITY_DISEASES = [
  'heart disease', 'diabetes', 'hypertension', 'cancer', 'kidney disease',
  'liver disease', 'severe asthma', 'chronic bronchitis', 'pneumonia',
  'severe infections', 'severe allergic reactions', 'blood clots',
  'severe anemia', 'thyroid disease', 'severe arthritis'
];

// Moderate severity (4-6)
const MODERATE_SEVERITY_DISEASES = [
  'asthma', 'migraine', 'gastroenteritis', 'bronchitis', 'acid reflux',
  'allergies', 'eczema', 'psoriasis', 'arthritis', 'depression', 'anxiety',
  'insomnia', 'hypertension (mild)', 'hypothyroidism'
];

// Low severity (1-3)
const LOW_SEVERITY_DISEASES = [
  'common cold', 'flu', 'cough', 'fever', 'headache', 'sore throat',
  'runny nose', 'congestion', 'minor burns', 'minor cuts', 'fatigue'
];

export const getSeverityScore = (disease: string): number => {
  const lowerDisease = disease.toLowerCase();

  // Check critical
  if (CRITICAL_DISEASES.some(d => lowerDisease.includes(d))) {
    return 9 + Math.random(); // 9-10
  }

  // Check high severity
  if (HIGH_SEVERITY_DISEASES.some(d => lowerDisease.includes(d))) {
    return 7 + Math.random(); // 7-8
  }

  // Check moderate
  if (MODERATE_SEVERITY_DISEASES.some(d => lowerDisease.includes(d))) {
    return 4 + Math.random() * 3; // 4-6
  }

  // Check low
  if (LOW_SEVERITY_DISEASES.some(d => lowerDisease.includes(d))) {
    return 1 + Math.random() * 3; // 1-3
  }

  // Default to moderate if not found
  return 5;
};

export const getSeverityLevel = (score: number): string => {
  if (score >= 9) return 'Critical';
  if (score >= 7) return 'High';
  if (score >= 4) return 'Moderate';
  return 'Low';
};

export const isEmergency = (score: number, threshold: number = 7): boolean => {
  return score >= threshold;
};
