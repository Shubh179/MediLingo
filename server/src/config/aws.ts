import { TextractClient } from '@aws-sdk/client-textract';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { S3Client } from '@aws-sdk/client-s3';

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS credentials not found. AWS services will not be available.');
}

// AWS Client Configuration
const awsConfig = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
} : {
  region: AWS_REGION,
};

// Initialize AWS clients
export const textractClient = new TextractClient(awsConfig);
export const bedrockClient = new BedrockRuntimeClient(awsConfig);
export const s3Client = new S3Client(awsConfig);

// AWS Service Configuration
export const AWS_CONFIG = {
  region: AWS_REGION,
  textract: {
    maxDocumentSizeBytes: 10 * 1024 * 1024, // 10MB
    supportedFormats: ['image/jpeg', 'image/png', 'application/pdf'],
    timeoutMs: 30000, // 30 seconds
  },
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
    maxTokens: 4000,
    temperature: 0.1, // Low temperature for medical accuracy
    timeoutMs: 30000, // 30 seconds
  },
  s3: {
    bucketName: process.env.S3_BUCKET_NAME || 'medical-assistant-prescriptions',
    region: AWS_REGION,
    presignedUrlExpiry: 3600, // 1 hour
  },
};

// Validation function to check if AWS services are properly configured
export function validateAWSConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!AWS_ACCESS_KEY_ID) {
    errors.push('AWS_ACCESS_KEY_ID environment variable is required');
  }

  if (!AWS_SECRET_ACCESS_KEY) {
    errors.push('AWS_SECRET_ACCESS_KEY environment variable is required');
  }

  if (!process.env.S3_BUCKET_NAME) {
    warnings.push('S3_BUCKET_NAME not specified, using default bucket name');
  }

  if (!process.env.BEDROCK_MODEL_ID) {
    warnings.push('BEDROCK_MODEL_ID not specified, using default Claude model');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper function to check if AWS services are available
export async function checkAWSServicesHealth(): Promise<{
  textract: boolean;
  bedrock: boolean;
  s3: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  let textractAvailable = false;
  let bedrockAvailable = false;
  let s3Available = false;

  try {
    // Test Textract availability
    await textractClient.config.region();
    textractAvailable = true;
  } catch (error) {
    errors.push(`Textract unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Test Bedrock availability
    await bedrockClient.config.region();
    bedrockAvailable = true;
  } catch (error) {
    errors.push(`Bedrock unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Test S3 availability
    await s3Client.config.region();
    s3Available = true;
  } catch (error) {
    errors.push(`S3 unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    textract: textractAvailable,
    bedrock: bedrockAvailable,
    s3: s3Available,
    errors,
  };
}