import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectDB from './config/db';
import prescriptionRoutes from './routes/prescriptionRoutes';
import voiceRoutes from './routes/voiceRoutes';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import chatRoutes from './routes/chatRoutes';
import { SESSION_SECRET, NODE_ENV, FRONTEND_URL, PORT } from './config/env';

// Initialize configuration
dotenv.config();

// Connect to MongoDB
connectDB();

const app: Application = express();

// Middleware - Cookie Parser
app.use(cookieParser());

// Middleware - CORS (configured for frontend)
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true, // Allow cookies to be sent
}));

// Middleware - Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware - Sessions
app.use(session({
  secret: SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent JavaScript from accessing the cookie
    sameSite: 'strict', // CSRF protection
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
  name: 'medilingo_session', // Custom session cookie name
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/chat', chatRoutes);

// Basic Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.send('MediLingo API is running...');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
});