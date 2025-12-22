import mongoose from 'mongoose';

// Database Configuration
export const DATABASE_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-assistant',
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    bufferMaxEntries: 0,
  },
};

// Database connection state
let isConnected = false;

// Connect to MongoDB
export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('Database already connected');
    return;
  }

  try {
    await mongoose.connect(DATABASE_CONFIG.uri, DATABASE_CONFIG.options);
    isConnected = true;
    console.log('MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    isConnected = false;
    throw error;
  }
}

// Disconnect from MongoDB
export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

// Check database connection status
export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  status: string;
  responseTime: number;
}> {
  const startTime = Date.now();
  
  try {
    if (!isDatabaseConnected()) {
      return {
        isHealthy: false,
        status: 'disconnected',
        responseTime: Date.now() - startTime,
      };
    }

    // Perform a simple ping operation
    await mongoose.connection.db.admin().ping();
    
    return {
      isHealthy: true,
      status: 'connected',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      isHealthy: false,
      status: `error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      responseTime: Date.now() - startTime,
    };
  }
}

// Graceful shutdown handler
export function setupDatabaseShutdownHandlers(): void {
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Closing database connection...`);
    try {
      await disconnectDatabase();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
}