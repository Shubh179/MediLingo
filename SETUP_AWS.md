# 🚀 AWS Textract & Bedrock Setup Guide

## What's New
- **AWS Textract**: Accurate OCR for prescription image analysis
- **AWS Bedrock**: Claude AI for intelligent medicine analysis & chatbot
- **Google Maps Integration**: Find nearby hospitals with real-time map links
- **Dose Tracking**: Record medicine doses

## Step 1: Get AWS Credentials

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Sign in with your AWS account (create one if needed)
3. Go to **IAM** → **Users** → **Create User**
4. Set username and enable **Programmatic access**
5. Attach these policies:
   - `AmazonTextractFullAccess`
   - `AmazonBedrockFullAccess`

6. Create access key and copy:
   - Access Key ID
   - Secret Access Key

## Step 2: Update `.env.local`

Edit `.env.local` in your project root:

```
VITE_GEMINI_API_KEY=AIzaSyB8HbAK9mwMdrpMKUYHjqVeFDm0-sUgP48

VITE_AWS_ACCESS_KEY_ID=your_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key
VITE_AWS_REGION=us-east-1
```

Replace with your actual AWS credentials.

## Step 3: Enable Bedrock Models

1. Go to AWS Console → **Bedrock**
2. Click **Model access** (left sidebar)
3. Click **Manage model access**
4. Enable `Anthropic Claude 3 Sonnet`
5. Click **Save changes**

(Note: May take a few minutes to activate)

## Step 4: Restart App

```bash
npm run dev
```

## Features Now Available

✅ **Upload Prescription**
- Takes photo/PDF of prescription
- AWS Textract extracts text automatically
- Bedrock analyzes medicines & creates list

✅ **Smart Chatbot**
- "I took 2 tablets of Aspirin"
- "Find nearby hospitals"
- "What medicines do I have?"
- Powered by Claude AI on Bedrock

✅ **Find Hospitals**
- Click "Find Hospitals" button
- Uses your GPS location
- Shows 10 nearest hospitals
- Direct Google Maps links

✅ **Dose Tracking**
- Record medicine doses
- Local storage persistence
- View dose history

## Pricing
- **Textract**: $1.00 per 1000 pages
- **Bedrock**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Free tier**: 100 pages/month for first 3 months

## Troubleshooting

### Error: "Invalid credentials"
- Check AWS Access Key ID and Secret
- Verify keys are active in IAM console

### Error: "Model not found"
- Make sure Bedrock models are enabled
- Wait a few minutes for activation

### Error: "Textract access denied"
- Verify `AmazonTextractFullAccess` policy is attached
- Check AWS region is correct

### Hospitals not showing
- Enable location services in browser
- Allow location permission when prompted
- Make sure you're in an area with hospitals nearby

## Tips

- Keep AWS credentials secure - never commit to git
- Monitor AWS billing to avoid surprises
- Test with small prescriptions first
- Hospital search works best in urban areas

Need help? Check AWS documentation:
- https://docs.aws.amazon.com/textract/
- https://docs.aws.amazon.com/bedrock/
