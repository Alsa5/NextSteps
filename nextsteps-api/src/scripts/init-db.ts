/**
 * Initialize MongoDB database with collections and indexes
 * Run once on fresh environment setup or to ensure indexes exist
 * Safe to re-run — createCollection and createIndex are idempotent
 * Usage: npm run init-db
 */

import { getDb } from '../db/mongo.js';
import { seedDevPersonalUsers } from '../services/seed-dev-users.js';
import { seedTraineeRegistry } from '../services/seed-trainee-registry.js';
import { seedTrainerScoresDevData } from '../services/seed-trainer-scores.js';
import { createUserRepository } from '../repositories/user-repository.js';
import { createTraineeRegistryRepository } from '../repositories/trainee-registry-repository.js';

async function initDatabase() {
  try {
    console.log('🚀 Initializing database...\n');

    const db = getDb();

    // Define collections with their indexes
    const collections: Array<{
      name: string;
      indexes: Array<{ key: Record<string, 1 | -1>; unique?: boolean }>;
    }> = [
      {
        name: 'users',
        indexes: [
          { key: { email: 1 }, unique: true },
          { key: { role: 1 } }
        ]
      },
      {
        name: 'session_feedback',
        indexes: [
          { key: { trainerEmail: 1 } },
          { key: { sessionId: 1 } },
          { key: { batchId: 1 } },
          { key: { submittedAt: -1 } }
        ]
      },
      {
        name: 'trainer_scores',
        indexes: [
          { key: { trainerEmail: 1 }, unique: true },
          { key: { tier: 1 } },
          { key: { scorePercentage: -1 } },
          { key: { updatedAt: -1 } }
        ]
      },
      {
        name: 'trainee_registry',
        indexes: [
          { key: { email: 1 }, unique: true },
          { key: { batchId: 1 } }
        ]
      },
      {
        name: 'notifications',
        indexes: [
          { key: { userId: 1 } },
          { key: { createdAt: -1 } },
          { key: { read: 1 } }
        ]
      },
      {
        name: 'sessions',
        indexes: [
          { key: { trainerId: 1 } },
          { key: { batchId: 1 } },
          { key: { date: -1 } }
        ]
      },
      {
        name: 'role_mappings',
        indexes: [
          { key: { email: 1 }, unique: true }
        ]
      }
    ];

    // Create collections and indexes
    console.log('📦 Creating collections and indexes...');
    for (const col of collections) {
      try {
        await db.createCollection(col.name);
        console.log(`   ✅ Collection created: ${col.name}`);
      } catch (e: any) {
        if (e.codeName === 'NamespaceExists') {
          console.log(`   ⏭  Collection exists: ${col.name}`);
        } else {
          throw e;
        }
      }

      // Create indexes
      for (const index of col.indexes) {
        await db.collection(col.name).createIndex(index.key, {
          unique: index.unique ?? false,
          background: true
        });
      }
      console.log(`   📍 Indexes set for: ${col.name}`);
    }

    console.log('\n✨ Collections and indexes ready!\n');

    // Run seeders in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌱 Seeding development data...\n');

      console.log('   Seeding dev users...');
      const userRepo = createUserRepository();
      await seedDevPersonalUsers(userRepo);

      console.log('   Seeding trainee registry...');
      const registryRepo = createTraineeRegistryRepository();
      await seedTraineeRegistry(registryRepo);

      console.log('   Seeding trainer scores...');
      await seedTrainerScoresDevData();

      console.log('\n✨ Development data seeded!\n');
    } else {
      console.log('⚠️  Skipping seeders in production\n');
    }

    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
