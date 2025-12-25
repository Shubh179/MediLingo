import { Request, Response } from 'express';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env';
import { MedicalHistory } from '../models/MedicalHistory';
import { MedicalKnowledge } from '../models/MedicalKnowledge';
import { getSeverityScore, getSeverityLevel, isEmergency } from '../utils/severityScorer';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const EMERGENCY_THRESHOLD = 7; // Show ambulance button if severity >= 7

const candidateModels = [
  GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-latest',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.5-pro-latest',
].filter(Boolean);

const isNotFound = (err: unknown) => {
  const msg = (err as any)?.message || String(err);
  return msg.toLowerCase().includes('not found');
};

// Keywords that trigger semantic search for remedies
const ADVISORY_KEYWORDS = [
  'suggest', 'advice', 'recommend', 'remedy', 'treatment', 'cure',
  'help', 'solution', 'what should', 'how to treat', 'manage',
  'prevent', 'relief', 'medication for', 'having', 'suffer', 'have',
  'experiencing', 'symptoms of', 'diagnosed', 'pain', 'ache', 'trouble'
];

// Disease keywords to detect medical queries
const DISEASE_KEYWORDS = [
  'diabetes', 'hypertension', 'blood pressure', 'sugar', 'cholesterol',
  'asthma', 'migraine', 'headache', 'fever', 'cold', 'flu', 'cough',
  'allergy', 'pain', 'arthritis', 'thyroid', 'heart', 'kidney',
  'bronchitis', 'pharyngitis', 'meningitis', 'tuberculosis', 'eczema',
  'acid reflux', 'gastroenteritis', 'dehydration', 'insomnia', 'glaucoma',
  'hernia', 'herniated disc', 'raynaud', 'lymph', 'electrolyte', 'infection',
  'chest pain', 'stroke', 'pneumonia', 'cancer', 'anxiety', 'depression'
];

const shouldUseSemanticSearch = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  const hasAdvisoryKeyword = ADVISORY_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const hasDiseaseKeyword = DISEASE_KEYWORDS.some(kw => lowerMessage.includes(kw));
  // Return true if message has advisory keywords OR disease keywords
  // This catches queries like "suggest remedy for fever" or "I'm having chest pain"
  return hasAdvisoryKeyword || hasDiseaseKeyword;
};

// Map common symptoms to actual database diseases
const SYMPTOM_TO_DISEASE_MAP: { [key: string]: string } = {
  'fever': 'Meningitis',  // Fever can be serious, map to severe condition
  'chest pain': 'Heart Disease',
  'difficulty breathing': 'Respiratory Distress',
  'cold': 'Pharyngitis',
  'cough': 'Bronchitis',
  'headache': 'Migraine',
  'pain': 'Migraine',
  'reflux': 'Acid Reflux',
  'stomach': 'Gastroenteritis',
  'water': 'Dehydration',
  'sleep': 'Insomnia',
  'itching': 'Eczema',
  'stroke': 'Stroke',
  'heart attack': 'Heart Disease'
};

// Extract disease name from message and try to find direct match
const findDiseaseFromQuery = async (userMessage: string) => {
  const lowerMessage = userMessage.toLowerCase();
  
  // First try symptom-to-disease mapping
  for (const [symptom, disease] of Object.entries(SYMPTOM_TO_DISEASE_MAP)) {
    if (lowerMessage.includes(symptom)) {
      const result = await MedicalKnowledge.findOne({ disease }).lean();
      if (result) return [result];
    }
  }
  
  // Then try direct disease name match
  const allDiseases = await MedicalKnowledge.distinct('disease');
  for (const disease of allDiseases) {
    if (lowerMessage.includes(disease.toLowerCase())) {
      const results = await MedicalKnowledge.find({ disease }).limit(3).lean();
      if (results.length > 0) return results;
    }
  }
  
  return null;
};

const performSemanticSearch = async (userMessage: string) => {
  // Generate embedding for user query (384-D)
  const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const embeddingResult = await embeddingModel.embedContent({
    content: { role: 'user', parts: [{ text: userMessage }] },
    taskType: TaskType.RETRIEVAL_QUERY,
    outputDimensionality: 384,
  });
  const queryVector = embeddingResult.embedding.values;

  // Perform vector search using MongoDB Atlas Vector Search
  const results = await MedicalKnowledge.aggregate([
    {
      $vectorSearch: {
        index: 'vector_index', // Atlas vector search index name
        path: 'healthSummaryVector',
        queryVector: queryVector,
        numCandidates: 100,
        limit: 3
      }
    },
    {
      $project: {
        disease: 1,
        remedy: 1,
        precautions: 1,
        symptoms: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]);

  return results;
};

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { userId, userMessage } = req.body;

    // Validate userMessage
    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({ error: 'userMessage is required and must be a string' });
    }

    // 1. Fetch the Patient's History to give Gemini context
    const history = userId ? await MedicalHistory.findOne({ userId }) : null;
    const context = history 
      ? `Patient History: ${history.chronicConditions.join(", ")}. Current Meds: ${history.activeMedications.map(m => m.name).join(", ")}.`
      : "No previous history found.";

    // 2. Check if query needs semantic search
    if (shouldUseSemanticSearch(userMessage)) {
      console.log('🔍 Using semantic search for:', userMessage);
      
      // Try direct disease name matching first
      let searchResults = await findDiseaseFromQuery(userMessage);
      
      // If no direct match, use vector search
      if (!searchResults) {
        console.log('📊 No direct match, performing vector search...');
        searchResults = await performSemanticSearch(userMessage);
      } else {
        console.log('✅ Found direct disease match');
      }
      
      if (searchResults && searchResults.length > 0) {
        const topMatch = searchResults[0] as any;
        const detectedDisease = topMatch.disease;
        const severityScore = getSeverityScore(detectedDisease);
        const severityLevel = getSeverityLevel(severityScore);
        const isEmergencySituation = isEmergency(severityScore, EMERGENCY_THRESHOLD);

        // Update medical history with severity score
        if (userId && history) {
          const updatedMaxScore = Math.max(history.maxSeverityScore || 0, severityScore);
          await MedicalHistory.updateOne(
            { userId },
            {
              maxSeverityScore: updatedMaxScore,
              lastSeverityScore: severityScore,
              $push: {
                severityHistory: {
                  score: Math.round(severityScore * 10) / 10,
                  detectedDisease,
                  timestamp: new Date()
                }
              },
              lastUpdated: new Date()
            }
          );
          console.log(`📊 Severity tracking - Disease: ${detectedDisease}, Score: ${Math.round(severityScore * 10) / 10}/10, Level: ${severityLevel}`);
        }

        const reply = `Based on your query about **${topMatch.disease}**, here's what I found:

**Remedy:** ${topMatch.remedy}

**Precautions:**
${topMatch.precautions?.map((p: string) => `• ${p}`).join('\n') || 'Consult a healthcare provider.'}

**Note:** This is general guidance. Please consult a doctor for personalized medical advice, especially given your context: ${context}`;

        return res.status(200).json({ 
          reply,
          searchResults: searchResults.slice(0, 3),
          source: 'semantic_search',
          severity: {
            score: Math.round(severityScore * 10) / 10,
            level: severityLevel,
            isEmergency: isEmergencySituation,
            disease: detectedDisease
          }
        });
      }
      // Fall through to Gemini if no results
      console.log('⚠️ No semantic search results, falling back to Gemini');
    }

    // 3. Default: Ask Gemini with Context (fall back across known working models when 404 occurs)
    const chatPrompt = `
      You are MediLingo, a helpful medical assistant.
      Context: ${context}
      User Question: ${userMessage}
      Answer clearly and remind the user to consult a doctor for emergencies.
    `;

    // Check for disease in user message even if not doing semantic search
    let detectedDisease = null;
    let severityScore = 0;
    let severityLevel = 'Low';
    let isEmergencySituation = false;

    const lowerMessage = userMessage.toLowerCase();
    for (const [symptom, disease] of Object.entries(SYMPTOM_TO_DISEASE_MAP)) {
      if (lowerMessage.includes(symptom)) {
        detectedDisease = disease;
        severityScore = getSeverityScore(disease);
        severityLevel = getSeverityLevel(severityScore);
        isEmergencySituation = isEmergency(severityScore, EMERGENCY_THRESHOLD);
        
        // Update medical history with severity
        if (userId && history) {
          const updatedMaxScore = Math.max(history.maxSeverityScore || 0, severityScore);
          await MedicalHistory.updateOne(
            { userId },
            {
              maxSeverityScore: updatedMaxScore,
              lastSeverityScore: severityScore,
              $push: {
                severityHistory: {
                  score: Math.round(severityScore * 10) / 10,
                  detectedDisease: disease,
                  timestamp: new Date()
                }
              },
              lastUpdated: new Date()
            }
          );
          console.log(`📊 Severity detected in Gemini path - Disease: ${disease}, Score: ${Math.round(severityScore * 10) / 10}/10, Level: ${severityLevel}`);
        }
        break;
      }
    }

    let lastError: unknown;
    for (const modelId of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent(chatPrompt);
        const response: any = {
          reply: result.response.text(),
          source: 'gemini_ai'
        };
        
        // Add severity if detected
        if (detectedDisease) {
          response.severity = {
            score: Math.round(severityScore * 10) / 10,
            level: severityLevel,
            isEmergency: isEmergencySituation,
            disease: detectedDisease
          };
        }
        
        return res.status(200).json(response);
      } catch (err) {
        lastError = err;
        if (isNotFound(err)) {
          continue;
        }
        break;
      }
    }

    console.error('Chatbot Error:', lastError);
    res.status(500).json({ error: 'Chatbot failed', details: (lastError as any)?.message });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({ error: 'Chatbot failed', details: (error as any)?.message });
  }
};