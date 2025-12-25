# Prescription Severity Analysis API

## Endpoint
`POST /api/prescriptions/analyze-severity`

## Description
Analyzes a prescription text and returns a severity score (1-10) along with detailed medical analysis including conditions, medications, risk factors, and recommendations.

## Request Body
```json
{
  "prescriptionText": "Patient prescription text from OCR or manual input",
  "userId": "optional-user-id-for-medical-history-context"
}
```

## Response Format
```json
{
  "success": true,
  "analysis": {
    "severityScore": 6,
    "severityLevel": "Moderate",
    "conditions": [
      "Hypertension",
      "Type 2 Diabetes"
    ],
    "medications": [
      "Metformin 500mg",
      "Lisinopril 10mg"
    ],
    "riskFactors": [
      "Multiple chronic conditions requiring monitoring",
      "Potential drug interactions between diabetes and BP medications"
    ],
    "recommendations": [
      "Regular blood glucose monitoring required",
      "Monthly blood pressure checks recommended",
      "Follow up with cardiologist in 3 months"
    ],
    "summary": "Patient has moderate severity with two chronic conditions requiring ongoing management and monitoring.",
    "databaseMatches": [
      {
        "disease": "Type 2 Diabetes",
        "severity": "Moderate",
        "precautions": ["Monitor blood sugar", "Regular exercise"],
        "remedy": "Metformin, insulin if needed"
      }
    ]
  }
}
```

## Severity Score Scale
- **1-3 (Low)**: Minor conditions, routine medications, no significant concerns
- **4-6 (Moderate)**: Chronic conditions requiring monitoring, multiple medications
- **7-8 (High)**: Serious conditions, high-risk medications, requires close monitoring
- **9-10 (Critical)**: Life-threatening conditions, emergency medications, immediate attention needed

## Usage Example with cURL
```bash
curl -X POST http://localhost:5001/api/prescriptions/analyze-severity \
  -H "Content-Type: application/json" \
  -d '{
    "prescriptionText": "Dr. Smith - Patient diagnosed with Type 2 Diabetes. Prescribed: Metformin 500mg twice daily, Glipizide 5mg once daily. Monitor blood glucose levels.",
    "userId": "user123"
  }'
```

## Usage Example with JavaScript/TypeScript
```typescript
const analyzePrescription = async (prescriptionText: string, userId?: string) => {
  try {
    const response = await fetch('http://localhost:5001/api/prescriptions/analyze-severity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prescriptionText,
        userId
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Severity Score:', data.analysis.severityScore);
      console.log('Severity Level:', data.analysis.severityLevel);
      console.log('Conditions:', data.analysis.conditions);
      console.log('Recommendations:', data.analysis.recommendations);
    }
    
    return data;
  } catch (error) {
    console.error('Severity analysis failed:', error);
  }
};

// Usage
analyzePrescription("Patient has hypertension, prescribed Lisinopril 10mg daily", "user123");
```

## Features
- ✅ AI-powered severity scoring (1-10 scale)
- ✅ Automatic condition detection from prescription text
- ✅ Medication extraction and analysis
- ✅ Risk factor identification
- ✅ Personalized recommendations
- ✅ Patient medical history integration (when userId provided)
- ✅ Cross-reference with medical knowledge database
- ✅ Multi-model fallback for reliability

## Notes
- Providing `userId` enables personalized analysis based on patient's medical history
- The API uses Gemini AI with fallback to multiple models for high availability
- Results are cross-referenced with the 20-disease medical knowledge database
- Analysis considers chronic conditions, active medications, and known allergies from patient history
