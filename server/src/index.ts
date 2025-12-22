import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import prescriptionRoutes from './routes/prescriptionRoutes'; // Added this import

// Initialize configuration
dotenv.config();

// Connect to MongoDB
connectDB();

const app: Application = express();

// Middleware
app.use(cors()); // Allows your React/Vite frontend to talk to this server
app.use(express.json()); // Allows the server to understand JSON sent in requests

// Routes
// This line connects your upload and chat logic to the URL path
app.use('/api/prescriptions', prescriptionRoutes); 

// Basic Health Check Route
app.get('/', (req: Request, res: Response) => {
  res.send('MediLingo API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});