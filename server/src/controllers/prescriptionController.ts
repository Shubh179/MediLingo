import { Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType, TaskType } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../config/env';
import { Prescription } from '../models/Prescription';
import { MedicalHistory } from '../models/MedicalHistory';

// Use the stable model identifier
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

export const processPrescription = async (req: Request, res: Response) => {
  try {
    const { userId, rawOcrText, targetLanguage } = req.body;

    // 1. Define the Schema for structured output
    const schema = {
      description: "Extracting structured medical data",
      type: SchemaType.OBJECT,
      properties: {
        doctorName: { type: SchemaType.STRING },
        medications: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              dosage: { type: SchemaType.STRING },
              frequency: { type: SchemaType.STRING },
              simpleInstruction: { type: SchemaType.STRING },
            },
            required: ["name", "dosage", "frequency", "simpleInstruction"],
          },
        },
        detectedConditions: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        translatedInstructions: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ["doctorName", "medications", "detectedConditions", "translatedInstructions"],
    };

    // 2. Initialize generative model with schema (fallback across candidates on 404)
    const prompt = `Convert this OCR text into structured JSON: "${rawOcrText}". Provide instructions in ${targetLanguage}.`;

    let lastError: unknown;
    let aiText = '';
    for (const modelId of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelId,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiText = response.text();
        break;
      } catch (err) {
        lastError = err;
        if (isNotFound(err)) {
          continue;
        }
        throw err;
      }
    }

    if (!aiText) {
      throw lastError || new Error('No available Gemini model for prescription processing.');
    }
    
    // 3. Parse Data
    const parsedData = JSON.parse(aiText);

    // --- NEW: VECTOR SEARCH STEP ---
    // Generate an embedding for the prescription text
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent({
      content: { role: "user", parts: [{ text: rawOcrText }] },
      taskType: TaskType.RETRIEVAL_DOCUMENT, // Optimized for storing in a DB
    });
    const vector = embeddingResult.embedding.values;
    // -------------------------------

    // 4. Save to Prescription Collection with Vector
    const newPrescription = await Prescription.create({
      userId,
      rawText: rawOcrText,
      doctorName: parsedData.doctorName,
      medications: parsedData.medications.map((m: any, index: number) => ({
        ...m,
        localInstruction: parsedData.translatedInstructions[index] || m.simpleInstruction
      })),
      healthSummaryVector: vector // Storing the numeric embedding
    });

    // 5. Update the Patient History
    await MedicalHistory.findOneAndUpdate(
      { userId },
      {
        $addToSet: { chronicConditions: { $each: parsedData.detectedConditions } },
        $push: { 
          activeMedications: { 
            $each: parsedData.medications.map((m: any) => ({
              name: m.name,
              prescriptionId: newPrescription._id,
              prescribedDate: new Date()
            }))
          } 
        },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, prescription: newPrescription });

  } catch (error: any) {
    console.error("Critical Error:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Processing failed. Check API Key or Model access.",
      error: error.message 
    });
  }
};

/**
 * SAVE RAW PRESCRIPTION - Simple endpoint that just saves OCR text without AI processing
 * Used by frontend when Gemini API is unavailable or for quick saves
 * Required fields: userId, rawOcrText
 * Optional: targetLanguage
 */
export const saveRawPrescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, rawOcrText, targetLanguage } = req.body;

    // Validation
    if (!userId || !rawOcrText) {
      res.status(400).json({
        success: false,
        message: 'userId and rawOcrText are required',
      });
      return;
    }

    // Parse basic medicine info from OCR text with improved extraction
    const medicines: any[] = [];
    const seenMedicines = new Set<string>(); // Avoid duplicates
    
    // Method 1: Look for patterns with dosages (most reliable)
    const dosagePattern = /([A-Za-z\s]+?)\s+(\d+(?:\.\d+)?)\s*(mg|ml|g|units|IU)\b/gi;
    let dosageMatch;
    while ((dosageMatch = dosagePattern.exec(rawOcrText)) !== null) {
      const medicineName = dosageMatch[1].trim();
      const dosage = `${dosageMatch[2]} ${dosageMatch[3]}`;
      
      // Filter out common non-medicine words
      if (medicineName.length > 2 && medicineName.length < 100 && 
          !medicineName.match(/^(for|take|after|before|meals|daily|twice|thrice|times|and|or|Type|Diabetes|meal|day|hours)$/i) &&
          !seenMedicines.has(medicineName.toLowerCase())) {
        medicines.push({
          name: medicineName,
          dosage: dosage,
          frequency: 'As directed',
          simpleInstruction: 'Follow doctor\'s instructions',
        });
        seenMedicines.add(medicineName.toLowerCase());
      }
    }
    
    // Method 2: Look for medicine names followed by common patterns (Tab., Syp., Cap., etc.)
    const commonMedicinePattern = /(?:Tab\.|Syp\.|Cap\.|Inj\.|drops|liquid)?\s*([A-Za-z][A-Za-z\s]+?)\s*(?:\d+\s*(?:mg|ml|g)?)?(?:\s*(?:BD|OD|TDS|QID|once|twice|thrice)|$)/gi;
    let commonMatch;
    while ((commonMatch = commonMedicinePattern.exec(rawOcrText)) !== null) {
      const medicineName = commonMatch[1].trim();
      if (medicineName.length > 2 && medicineName.length < 100 && 
          !medicineName.match(/^(for|take|after|before|meals|daily|twice|thrice|times|Type|Diabetes)$/i) &&
          !seenMedicines.has(medicineName.toLowerCase())) {
        medicines.push({
          name: medicineName,
          dosage: 'As prescribed',
          frequency: 'As directed',
          simpleInstruction: 'Follow doctor\'s instructions',
        });
        seenMedicines.add(medicineName.toLowerCase());
      }
    }
    
    // Method 3: If still no medicines found, try to extract capitalized words (last resort)
    if (medicines.length === 0) {
      const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
      let capMatch;
      while ((capMatch = capitalizedPattern.exec(rawOcrText)) !== null) {
        const word = capMatch[1];
        // Skip common English words and medical terms that aren't medicines
        if (word.length > 2 && word.length < 100 &&
            !word.match(/^(Dr|Rx|Type|Diabetes|Dosage|Frequency|Take|Twice|Daily|After|Meals|Instructions)$/i) &&
            !seenMedicines.has(word.toLowerCase())) {
          medicines.push({
            name: word,
            dosage: 'As prescribed',
            frequency: 'As directed',
            simpleInstruction: 'Follow doctor\'s instructions',
          });
          seenMedicines.add(word.toLowerCase());
        }
      }
    }
    
    console.log(`🔍 Extracted ${medicines.length} medicines from OCR:`, medicines.map((m: any) => m.name));

    // Save prescription
    const newPrescription = await Prescription.create({
      userId,
      rawText: rawOcrText,
      doctorName: 'Not extracted',
      medications: medicines.length > 0 ? medicines : [{
        name: 'Medicine details',
        dosage: 'See prescription text',
        frequency: 'As directed',
        simpleInstruction: rawOcrText.substring(0, 100),
      }],
      scannedAt: new Date(),
    });

    // Update medical history
    await MedicalHistory.findOneAndUpdate(
      { userId },
      {
        $push: {
          activeMedications: {
            $each: medicines.map((m: any) => ({
              name: m.name,
              prescriptionId: newPrescription._id,
              prescribedDate: new Date(),
            })),
          },
        },
        $set: { lastUpdated: new Date() },
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Prescription saved for user ${userId}: ${medicines.length} medicines extracted`);

    res.status(201).json({
      success: true,
      message: 'Prescription saved successfully',
      prescription: {
        id: newPrescription._id,
        userId: newPrescription.userId,
        medicinesCount: medicines.length,
        medicines: medicines.map((m: any) => m.name),
      },
    });
  } catch (error: any) {
    console.error('Save Raw Prescription Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to save prescription',
      error: error.message,
    });
  }
};