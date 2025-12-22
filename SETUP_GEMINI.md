# 🚀 Setup Guide - Gemini AI Medicine Assistant

## Prerequisites
- Node.js 16+ installed
- Google Gemini API Key

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new API key for this project
5. Copy the API key

## Step 2: Configure Environment

1. Create a `.env.local` file in the project root:
```bash
cd c:\Users\HP\Downloads\medilingo-clear-main
```

2. Add your Gemini API key:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual API key from Google AI Studio.

## Step 3: Install Dependencies

```bash
npm install
```

The `@google/generative-ai` package is already added to package.json.

## Step 4: Run the Application

```bash
npm run dev
```

The app will start at `http://localhost:5173`

## How to Use

### 1. Upload Prescription
- Click "Scan Prescription" on the home page
- Upload a photo or PDF of your prescription
- The AI will automatically extract medicines

### 2. Chat with AI Assistant
Ask the AI assistant anything:
- **Track doses**: "I took 2 tablets of Aspirin"
- **Find hospitals**: "Find nearby hospitals"
- **View history**: "Show my dose history"
- **Get advice**: "What should I do with my medicines?"

### 3. Features
✅ AI-powered medicine tracking
✅ Real-time dose recording
✅ Hospital/clinic finder with maps
✅ Medicine history and reminders
✅ Personalized health advice
✅ Multiple language support (coming soon)

## Troubleshooting

### Error: "VITE_GEMINI_API_KEY not configured"
- Make sure `.env.local` file exists in the project root
- Verify the API key is correctly set
- Restart the dev server after changing `.env.local`

### Error: "API key is invalid"
- Check that you copied the full API key from Google AI Studio
- No quotes needed in `.env.local`

### Slow responses
- Gemini API might have rate limits
- Wait a few seconds before sending another message

## API Limits (Free Tier)
- 60 requests per minute
- Suitable for development and testing

For production, consider upgrading your plan at Google Cloud.

## Project Structure

```
src/
  lib/
    geminiService.ts      # Gemini AI integration
  contexts/
    MedicineHistoryContext.tsx  # Medicine data management
  components/
    AdvancedChatbot.tsx   # Main chatbot UI
    PrescriptionChatbotPage.tsx  # Upload + Chat layout
```

Happy coding! 💊✨
