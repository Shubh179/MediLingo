import { connectDatabase, isDatabaseConnected } from '../config/database.js';
import { User } from '../models/User.js';
import { Prescription } from '../models/Prescription.js';
import { MedicalHistory } from '../models/MedicalHistory.js';

// Migration interface
interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

// Migration tracking schema
import mongoose, { Schema } from 'mongoose';

const MigrationSchema = new Schema({
  version: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
});

const MigrationModel = mongoose.model('Migration', MigrationSchema);

// Available migrations
const migrations: Migration[] = [
  {
    version: '001',
    description: 'Initial database setup with indexes',
    up: async () => {
      console.log('Creating initial indexes...');
      
      // Ensure User indexes
      await User.createIndexes();
      console.log('User indexes created');
      
      // Ensure Prescription indexes
      await Prescription.createIndexes();
      console.log('Prescription indexes created');
      
      // Ensure MedicalHistory indexes
      await MedicalHistory.createIndexes();
      console.log('MedicalHistory indexes created');
      
      console.log('Initial database setup completed');
    },
    down: async () => {
      console.log('Dropping all indexes...');
      
      await User.collection.dropIndexes();
      await Prescription.collection.dropIndexes();
      await MedicalHistory.collection.dropIndexes();
      
      console.log('All indexes dropped');
    },
  },
  {
    version: '002',
    description: 'Add compound indexes for performance optimization',
    up: async () => {
      console.log('Creating compound indexes...');
      
      // User compound indexes
      await User.collection.createIndex({ email: 1, isActive: 1 });
      await User.collection.createIndex({ createdAt: -1, isActive: 1 });
      
      // Prescription compound indexes
      await Prescription.collection.createIndex({ userId: 1, status: 1, createdAt: -1 });
      await Prescription.collection.createIndex({ status: 1, updatedAt: -1 });
      
      // MedicalHistory compound indexes
      await MedicalHistory.collection.createIndex({ userId: 1, visitDate: -1, createdAt: -1 });
      
      console.log('Compound indexes created');
    },
    down: async () => {
      console.log('Dropping compound indexes...');
      
      await User.collection.dropIndex({ email: 1, isActive: 1 });
      await User.collection.dropIndex({ createdAt: -1, isActive: 1 });
      await Prescription.collection.dropIndex({ userId: 1, status: 1, createdAt: -1 });
      await Prescription.collection.dropIndex({ status: 1, updatedAt: -1 });
      await MedicalHistory.collection.dropIndex({ userId: 1, visitDate: -1, createdAt: -1 });
      
      console.log('Compound indexes dropped');
    },
  },
];

// Get applied migrations
async function getAppliedMigrations(): Promise<string[]> {
  const applied = await MigrationModel.find({}).sort({ version: 1 });
  return applied.map(m => m.version);
}

// Mark migration as applied
async function markMigrationApplied(migration: Migration): Promise<void> {
  await MigrationModel.create({
    version: migration.version,
    description: migration.description,
  });
}

// Remove migration record
async function removeMigrationRecord(version: string): Promise<void> {
  await MigrationModel.deleteOne({ version });
}

// Run pending migrations
export async function runMigrations(): Promise<void> {
  if (!isDatabaseConnected()) {
    await connectDatabase();
  }

  console.log('Checking for pending migrations...');
  
  const appliedMigrations = await getAppliedMigrations();
  const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.version));
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  for (const migration of pendingMigrations) {
    console.log(`Running migration ${migration.version}: ${migration.description}`);
    
    try {
      await migration.up();
      await markMigrationApplied(migration);
      console.log(`Migration ${migration.version} completed successfully`);
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed successfully');
}

// Rollback last migration
export async function rollbackLastMigration(): Promise<void> {
  if (!isDatabaseConnected()) {
    await connectDatabase();
  }

  const appliedMigrations = await getAppliedMigrations();
  
  if (appliedMigrations.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const lastMigrationVersion = appliedMigrations[appliedMigrations.length - 1];
  const migration = migrations.find(m => m.version === lastMigrationVersion);
  
  if (!migration) {
    throw new Error(`Migration ${lastMigrationVersion} not found`);
  }

  console.log(`Rolling back migration ${migration.version}: ${migration.description}`);
  
  try {
    await migration.down();
    await removeMigrationRecord(migration.version);
    console.log(`Migration ${migration.version} rolled back successfully`);
  } catch (error) {
    console.error(`Rollback of migration ${migration.version} failed:`, error);
    throw error;
  }
}

// Get migration status
export async function getMigrationStatus(): Promise<{
  applied: Array<{ version: string; description: string; appliedAt: Date }>;
  pending: Array<{ version: string; description: string }>;
}> {
  if (!isDatabaseConnected()) {
    await connectDatabase();
  }

  const appliedRecords = await MigrationModel.find({}).sort({ version: 1 });
  const appliedVersions = appliedRecords.map(r => r.version);
  
  const applied = appliedRecords.map(r => ({
    version: r.version,
    description: r.description,
    appliedAt: r.appliedAt,
  }));
  
  const pending = migrations
    .filter(m => !appliedVersions.includes(m.version))
    .map(m => ({
      version: m.version,
      description: m.description,
    }));

  return { applied, pending };
}

// Reset all migrations (dangerous - for development only)
export async function resetMigrations(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset migrations in production environment');
  }

  if (!isDatabaseConnected()) {
    await connectDatabase();
  }

  console.log('Resetting all migrations (development only)...');
  
  // Drop all collections
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.drop();
  }
  
  console.log('All collections dropped');
  console.log('Run migrations again to recreate the database structure');
}