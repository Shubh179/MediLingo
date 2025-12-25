# Severity Score Integration - Implementation Summary

## Overview
Implemented automatic disease severity scoring that detects high-risk conditions and displays an emergency ambulance button in the chatbot when severity exceeds the threshold (≥7/10).

## Components Implemented

### 1. **Severity Scoring Utility** (`server/src/utils/severityScorer.ts`)
- Maps diseases to severity scores (1-10 scale)
- Categories:
  - **Critical (9-10)**: Heart attack, stroke, sepsis, meningitis, etc.
  - **High (7-8)**: Diabetes, hypertension, cancer, kidney disease, severe asthma, pneumonia
  - **Moderate (4-6)**: Asthma, migraine, gastroenteritis, allergies, arthritis
  - **Low (1-3)**: Common cold, flu, fever, headache, sore throat
- Functions:
  - `getSeverityScore(disease)` - Returns numerical score
  - `getSeverityLevel(score)` - Returns text level (Low/Moderate/High/Critical)
  - `isEmergency(score, threshold)` - Checks if score exceeds threshold (default: 7)

### 2. **Database Model Update** (`server/src/models/MedicalHistory.ts`)
Added severity tracking fields:
```typescript
maxSeverityScore: number;      // Max severity detected (0-10)
lastSeverityScore: number;     // Most recent severity score
severityHistory: Array<{       // Historical log of severity scores
  score: number;
  detectedDisease: string;
  timestamp: Date;
}>;
```

### 3. **Backend API Integration** (`server/src/controllers/chatController.ts`)
- Imports severity scoring utility
- Sets `EMERGENCY_THRESHOLD = 7`
- When a disease is detected via semantic search:
  - Calculates severity score
  - Updates user's medical history with max/latest severity
  - Records disease and score in severityHistory
  - Returns severity data in API response

### 4. **Frontend Components**

#### ChatWindow.tsx
- Updated `Message` interface to include severity data
- Displays emergency alert banner when severity ≥ 7
- Shows red alert with ambulance button
- `onAmbulanceClick` prop to handle emergency action

#### ChatMessage.tsx
- Displays severity badge below bot responses
- Color-coded badges:
  - Red: Emergency (≥7)
  - Orange: High (7-8)
  - Yellow: Moderate (4-6)
  - Green: Low (1-3)
- Shows disease name, score, and severity level

#### Chatbot.tsx
- Updated to extract severity from API responses
- Passes severity data to ChatMessage
- `handleAmbulanceClick()` - Triggers emergency alert
- Shows: "Calling local emergency services... 911"

## API Response Format

When a disease is detected, the `/api/prescriptions/chat` endpoint returns:

```json
{
  "reply": "Based on your query about...",
  "searchResults": [...],
  "source": "semantic_search",
  "severity": {
    "score": 7.5,
    "level": "High",
    "isEmergency": true,
    "disease": "Heart Disease"
  }
}
```

## User Experience Flow

1. User asks about a disease in chatbot
2. AI detects the disease and calculates severity
3. Response includes:
   - Medical information
   - Severity badge under message
4. If severity ≥ 7:
   - Red emergency alert banner appears
   - Displays detected disease and severity score
   - Shows "🚑 Call Ambulance" button
5. Clicking ambulance button triggers emergency alert

## Severity Thresholds

- **Low (1-3)**: Routine conditions, no action needed
- **Moderate (4-6)**: Requires monitoring, standard medical care
- **High (7-8)**: Serious conditions, should see doctor soon
- **Critical (9-10)**: Life-threatening, immediate emergency action needed

### Emergency Button Trigger
- **Threshold**: Severity Score ≥ 7
- **Action**: Shows red alert banner + ambulance call button
- **Alert**: "This condition requires immediate medical attention. Please seek emergency care or call an ambulance."

## Data Persistence

- Severity scores are stored in MongoDB under MedicalHistory
- `maxSeverityScore` tracks the worst condition detected for that user
- `severityHistory` maintains timestamped log of all detected conditions
- Helps track health trends and identify recurring serious conditions

## Future Enhancements

1. Integrate with actual emergency services API
2. Add location-based ambulance dispatch
3. Send alerts to emergency contacts
4. Generate severity trend reports
5. Add prescription severity analysis endpoint
6. Track which medications trigger high severity responses
