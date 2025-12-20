#!/usr/bin/env node

import { config } from 'dotenv';
import { runMigrations, rollbackLastMigration, getMigrationStatus, resetMigrations } from '../migrations/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

// Load environment variables
config();

const command = process.argv[2];

async function main() {
  try {
    await connectDatabase();
    
    switch (command) {
      case 'up':
        await runMigrations();
        break;
        
      case 'down':
        await rollbackLastMigration();
        break;
        
      case 'status':
        const status = await getMigrationStatus();
        console.log('\n=== Migration Status ===');
        console.log('\nApplied Migrations:');
        if (status.applied.length === 0) {
          console.log('  None');
        } else {
          status.applied.forEach(m => {
            console.log(`  ✓ ${m.version}: ${m.description} (${m.appliedAt.toISOString()})`);
          });
        }
        
        console.log('\nPending Migrations:');
        if (status.pending.length === 0) {
          console.log('  None');
        } else {
          status.pending.forEach(m => {
            console.log(`  ○ ${m.version}: ${m.description}`);
          });
        }
        console.log('');
        break;
        
      case 'reset':
        if (process.env.NODE_ENV === 'production') {
          console.error('Cannot reset migrations in production environment');
          process.exit(1);
        }
        console.log('WARNING: This will delete all data in the database!');
        console.log('This operation is only available in development mode.');
        
        // Simple confirmation (in a real app, you might want a more robust confirmation)
        if (process.argv[3] === '--confirm') {
          await resetMigrations();
        } else {
          console.log('Add --confirm flag to proceed with reset');
        }
        break;
        
      default:
        console.log('Usage: npm run migrate <command>');
        console.log('');
        console.log('Commands:');
        console.log('  up      - Run pending migrations');
        console.log('  down    - Rollback last migration');
        console.log('  status  - Show migration status');
        console.log('  reset   - Reset all migrations (development only, requires --confirm)');
        console.log('');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main();