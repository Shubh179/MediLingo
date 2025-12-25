import { Request, Response } from 'express';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env';
import { MedicalHistory } from '../models/MedicalHistory';
import { MedicalKnowledge } from '../models/MedicalKnowledge';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

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
  'prevent', 'relief', 'medication for'
];

// Disease keywords to detect medical queries
const DISEASE_KEYWORDS = [
  'diabetes', 'hypertension', 'blood pressure', 'sugar', 'cholesterol',
  'asthma', 'migraine', 'headache', 'fever', 'cold', 'flu', 'cough',
  'allergy', 'pain', 'arthritis', 'thyroid', 'heart', 'kidney',
  'bronchitis', 'pharyngitis', 'meningitis', 'tuberculosis', 'eczema',
  'acid reflux', 'gastroenteritis', 'dehydration', 'insomnia', 'glaucoma',
  'hernia', 'herniated disc', 'raynaud', 'lymph', 'electrolyte', 'infection'
];

// Map common symptoms to actual database diseases
const SYMPTOM_TO_DISEASE_MAP: { [key: string]: string } = {
  'fever': 'Meningitis',  // Fever can be serious, map to severe condition
  'cold': 'Pharyngitis',
  'cough': 'Bronchitis',
  'headache': 'Migraine',
  'pain': 'Migraine',
  'reflux': 'Acid Reflux',
  'stomach': 'Gastroenteritis',
  'water': 'Dehydration',
  'sleep': 'Insomnia',
  'itching': 'Eczema'
};

const shouldUseSemanticSearch = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  const hasAdvisoryKeyword = ADVISORY_KEYWORDS.some(kw => lowerMessage.includes(kw));
  const hasDiseaseKeyword = DISEASE_KEYWORDS.some(kw => lowerMessage.includes(kw));
  return hasAdvisoryKeyword && hasDiseaseKeyword;
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

    // 1. Fetch the Patient's History to give Gemini context
    const history = await MedicalHistory.findOne({ userId });
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
        const reply = `Based on your query about **${topMatch.disease}**, here's what I found:

**Remedy:** ${topMatch.remedy}

**Precautions:**
${topMatch.precautions?.map((p: string) => `• ${p}`).join('\n') || 'Consult a healthcare provider.'}

**Note:** This is general guidance. Please consult a doctor for personalized medical advice, especially given your context: ${context}`;

        return res.status(200).json({ 
          reply,
          searchResults: searchResults.slice(0, 3),
          source: 'semantic_search'
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

    let lastError: unknown;
    for (const modelId of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContent(chatPrompt);
        return res.status(200).json({ 
          reply: result.response.text(),
          source: 'gemini_ai'
        });
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