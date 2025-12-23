# MediLingo 🏥💊

A comprehensive AI-powered medical assistant application that helps users manage prescriptions, track medications, and get intelligent health recommendations.

## ✨ Features

### 🔍 Smart Prescription Processing
- **OCR Technology**: Upload prescription images/PDFs and extract medication information automatically using Tesseract.js
- **AI Analysis**: Powered by Google Gemini AI for intelligent prescription interpretation
- **Multi-format Support**: Supports JPEG, PNG, and PDF prescription formats

### 🤖 Intelligent Medical Chatbot
- **AI-Powered Conversations**: Chat with an intelligent medical assistant
- **Medication Tracking**: "I took 2 tablets of Aspirin" - track your doses automatically
- **Hospital Finder**: "Find nearby hospitals" - get location-based medical facility recommendations
- **Medicine History**: View and manage your complete medication history
- **Health Advice**: Get personalized health recommendations based on your profile

### 🔐 Secure Authentication System
- **User Registration & Login**: Secure account management with JWT authentication
- **Password Reset**: Complete forgot password functionality with OTP verification
- **Session Management**: Secure session handling with refresh tokens

### 📱 Modern User Interface
- **Responsive Design**: Built with React, TypeScript, and Tailwind CSS
- **Component Library**: Utilizes Radix UI and shadcn/ui for consistent, accessible components
- **Dark/Light Theme**: Theme switching with next-themes
- **Mobile-First**: Optimized for all device sizes

### 🏥 Medical Management
- **Prescription History**: Complete record of all processed prescriptions
- **Medication Patterns**: AI-powered analysis of medication usage patterns
- **Health Recommendations**: Personalized suggestions based on medical history
- **Location Services**: Find nearby pharmacies and hospitals

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Google Gemini API key
- AWS Account (for advanced features)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/medilingo.git
cd medilingo
```

### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Gemini API key to .env.local
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Backend Setup
```bash
# Navigate to server directory
cd server

# Install server dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your environment variables in .env
```

### 4. Start Development Servers

**Frontend** (Port 5173):
```bash
npm run dev
```

**Backend** (Port 3000):
```bash
cd server
npm run dev
```

Visit `http://localhost:5173` to access the application.

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful, customizable components
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Type-safe server development
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email functionality

### AI & Processing
- **Google Gemini AI** - Advanced language model for medical insights
- **Tesseract.js** - OCR for prescription text extraction
- **AWS Textract** - Advanced document processing (optional)
- **AWS Bedrock** - Additional AI capabilities (optional)

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Vite** - Build tool
- **PostCSS** - CSS processing

## 📁 Project Structure

```
medilingo/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Plan)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   ├── pages/           # Page components
│   │   └── App.tsx          # Main application component
│   ├── public/              # Static assets
│   └── package.json
├── server/                   # Express backend server
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   └── package.json
├── public/                   # Shared static assets
└── docs/                     # Documentation files
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local):**
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Backend (.env):**
```env
MONGODB_URI=mongodb://localhost:27017/medilingo
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### API Keys Setup

1. **Google Gemini AI**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Create an API key
   - Add to both frontend and backend environment files

2. **MongoDB**:
   - Install MongoDB locally or use MongoDB Atlas
   - Update the connection string in server/.env

## 🧪 Testing

### Frontend Testing
```bash
npm run lint          # Run ESLint
npm run build         # Build for production
npm run preview       # Preview production build
```

### Backend Testing
```bash
cd server
npm run build         # Compile TypeScript
npm run type-check    # Check types
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/verify-otp` - Verify OTP for password reset
- `POST /api/auth/reset-password` - Reset password with OTP

### Prescription Endpoints
- `POST /api/prescriptions/upload` - Upload prescription image
- `GET /api/prescriptions/:id` - Get prescription details
- `GET /api/prescriptions/user/:userId` - Get user prescriptions

### Chat & AI Endpoints
- `POST /api/chat` - Chat with medical assistant
- `POST /api/recommendations` - Get AI recommendations

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd server
npm run build
npm start
# Deploy to your server or cloud platform
```

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Railway, Render, or AWS EC2
- **Database**: MongoDB Atlas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
