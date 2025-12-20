# Medical Assistant System - Server

Backend server for the Medical Assistant System, providing prescription processing, medical history management, AI-powered recommendations, and location services.

## Prerequisites

- Node.js 18+ 
- MongoDB 6+
- AWS Account with Textract, Bedrock, and S3 access
- Google Maps API key (for location services)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens (generate a secure random string)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens (generate a secure random string)
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `S3_BUCKET_NAME`: S3 bucket for prescription images
- `ENCRYPTION_KEY`: 32-byte hex key for medical data encryption

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Run Database Migrations

```bash
npm run migrate:up
```

Check migration status:
```bash
npm run migrate:status
```

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   ├── aws.ts       # AWS SDK configuration
│   │   ├── database.ts  # MongoDB configuration
│   │   └── environment.ts # Environment validation
│   ├── middleware/      # Express middleware
│   │   └── auth.ts      # Authentication middleware
│   ├── migrations/      # Database migrations
│   │   └── index.ts     # Migration management
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   ├── Prescription.ts
│   │   └── MedicalHistory.ts
│   ├── scripts/         # Utility scripts
│   │   └── migrate.ts   # Migration CLI
│   ├── services/        # Business logic services
│   │   └── HealthService.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   └── utils/           # Utility functions
│       └── security.ts  # Security utilities
├── index.js             # Server entry point
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-reload
- `npm run migrate:up` - Run pending database migrations
- `npm run migrate:down` - Rollback last migration
- `npm run migrate:status` - Show migration status
- `npm run build` - Compile TypeScript to JavaScript
- `npm run type-check` - Check TypeScript types without building

## API Endpoints

### Health Check
- `GET /health` - System health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Prescriptions
- `POST /api/prescriptions/upload` - Upload prescription image
- `GET /api/prescriptions/:id` - Get prescription details
- `GET /api/prescriptions/user/:userId` - Get user's prescriptions

### Medical History
- `GET /api/history/:userId` - Get user's medical history
- `GET /api/patterns/:userId` - Get medication patterns
- `POST /api/history` - Add manual history entry

### Recommendations
- `POST /api/recommendations` - Get AI recommendations
- `POST /api/chat` - Chat with medical assistant
- `GET /api/medications/:name/info` - Get medication information

### Location Services
- `GET /api/locations/pharmacies` - Find nearby pharmacies
- `GET /api/locations/hospitals` - Find nearby hospitals

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT-based authentication with refresh tokens
- AES-256-GCM encryption for medical data
- Rate limiting on authentication endpoints
- Input sanitization
- Secure session management
- HTTPS required in production

## Database Schema

### Users Collection
- User profiles with authentication credentials
- Emergency contacts and preferences
- Allergies and chronic conditions

### Prescriptions Collection
- Processed prescription data
- Extracted text and structured medications
- Processing status and confidence scores

### Medical History Collection
- Historical medical records
- Visit information and diagnoses
- Prescribing physician details

## AWS Services Integration

### AWS Textract
- Extracts text from prescription images
- Supports JPEG, PNG, and PDF formats
- 30-second timeout for processing

### AWS Bedrock
- Structures extracted text into medication data
- Generates AI-powered recommendations
- Uses Claude 3 Sonnet model by default

### AWS S3
- Stores prescription images temporarily
- Automatic cleanup after processing
- Presigned URLs for secure access

## Error Handling

The server implements comprehensive error handling:
- Graceful degradation when services are unavailable
- Detailed error messages in development
- Sanitized error messages in production
- Automatic retry with exponential backoff
- Health checks for all critical services

## Logging

Logs are written to console with configurable levels:
- `error` - Error messages only
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging information

Set log level in `.env`:
```
LOG_LEVEL=info
```

## Development

### Type Checking

```bash
npm run type-check
```

### Building

```bash
npm run build
```

Compiled files will be in the `dist/` directory.

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use strong, unique values for all secrets
3. Enable HTTPS
4. Configure proper CORS settings
5. Set up monitoring and logging
6. Configure database backups
7. Implement rate limiting
8. Use environment-specific AWS credentials

## Troubleshooting

### Database Connection Issues
- Verify MongoDB is running
- Check `MONGODB_URI` in `.env`
- Ensure network connectivity

### AWS Service Errors
- Verify AWS credentials are correct
- Check IAM permissions for Textract, Bedrock, and S3
- Ensure S3 bucket exists and is accessible

### Migration Errors
- Check database connection
- Review migration logs
- Use `npm run migrate:status` to check state

## License

Proprietary - Medical Assistant System