#!/usr/bin/env node
/**
 * MongoDB Database Initialization Script for NextSteps
 * 
 * Creates required collections and seeds essential configuration data.
 * Safe for production - does NOT create fake/sample users, quizzes, or submissions.
 * Idempotent - safe to run multiple times without creating duplicates.
 * 
 * Usage: npm run init-db
 */

import { MongoClient, Db } from 'mongodb';
import { createRoleMappingRepository, DEFAULT_DESIGNATION_MAPPINGS } from '../src/repositories/role-mapping-repository.js';

// Environment configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'nextsteps';

interface CollectionConfig {
  name: string;
  description: string;
  requiredIndexes?: { fields: Record<string, 1 | -1>; options?: any }[];
}

// All collections currently used by the application
const REQUIRED_COLLECTIONS: CollectionConfig[] = [
  {
    name: 'users',
    description: 'User authentication and profile data',
    requiredIndexes: [
      { fields: { email: 1 }, options: { unique: true } }
    ]
  },
  {
    name: 'role_mappings', 
    description: 'Email and designation-based role mappings',
    requiredIndexes: [
      { fields: { type: 1, value: 1 }, options: { unique: true } }
    ]
  },
  {
    name: 'quiz_submissions',
    description: 'Submitted quiz results and answers',
    requiredIndexes: [
      { fields: { quizId: 1 } },
      { fields: { batch: 1 } },
      { fields: { maverickId: 1 } },
      { fields: { submittedAt: -1 } }
    ]
  },
  {
    name: 'sessions',
    description: 'Training session records',
    requiredIndexes: [
      { fields: { id: 1 }, options: { unique: true } },
      { fields: { sessionId: 1 } },
      { fields: { batch: 1 } }
    ]
  },
  {
    name: 'transcripts',
    description: 'Session transcript data for AI analysis',
    requiredIndexes: [
      { fields: { sessionId: 1 } }
    ]
  },
  {
    name: 'quizzes',
    description: 'Published quiz metadata and questions (future use)',
    requiredIndexes: [
      { fields: { id: 1 }, options: { unique: true } },
      { fields: { batch: 1 } },
      { fields: { trainerEmail: 1 } }
    ]
  }
];

async function initializeDatabase(): Promise<void> {
  console.log('🚀 NextSteps Database Initialization');
  console.log(`📍 MongoDB URI: ${MONGODB_URI}`);
  console.log(`📁 Database: ${MONGODB_DATABASE}`);
  console.log();

  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db: Db = client.db(MONGODB_DATABASE);
    console.log('✅ Connected to MongoDB');
    console.log();

    // Create collections and indexes
    console.log('📋 Creating collections and indexes...');
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);

    for (const config of REQUIRED_COLLECTIONS) {
      const exists = existingNames.includes(config.name);
      
      if (!exists) {
        await db.createCollection(config.name);
        console.log(`✨ Created collection: ${config.name} (${config.description})`);
      } else {
        console.log(`✓ Collection exists: ${config.name}`);
      }

      // Create indexes if specified
      if (config.requiredIndexes) {
        const collection = db.collection(config.name);
        for (const indexConfig of config.requiredIndexes) {
          try {
            await collection.createIndex(indexConfig.fields, indexConfig.options || {});
            const indexName = Object.keys(indexConfig.fields).join('_');
            console.log(`  📌 Index created: ${config.name}.${indexName}`);
          } catch (error: any) {
            if (error.code === 85) { // Index already exists
              const indexName = Object.keys(indexConfig.fields).join('_');
              console.log(`  ✓ Index exists: ${config.name}.${indexName}`);
            } else {
              throw error;
            }
          }
        }
      }
    }
    
    console.log();

    // Seed role mappings (essential configuration)
    console.log('🔐 Seeding role mappings...');
    const roleMappings = createRoleMappingRepository();
    
    let seedCount = 0;
    for (const mapping of DEFAULT_DESIGNATION_MAPPINGS) {
      const existing = await roleMappings.findAll().then(mappings => 
        mappings.find(m => m.type === mapping.type && m.value === mapping.value)
      );
      if (!existing) {
        await roleMappings.seedDefaults([mapping]);
        seedCount++;
        console.log(`✨ Added role mapping: ${mapping.type}=${mapping.value} → ${mapping.role} (keywords: ${mapping.keywords?.join(', ')})`);
      } else {
        console.log(`✓ Role mapping exists: ${mapping.type}=${mapping.value} → ${existing.role}`);
      }
    }

    if (seedCount > 0) {
      console.log(`✅ Seeded ${seedCount} role mappings`);
    } else {
      console.log('✓ All role mappings already exist');
    }
    console.log();

    // Database statistics
    console.log('📊 Database Statistics:');
    for (const config of REQUIRED_COLLECTIONS) {
      const count = await db.collection(config.name).countDocuments();
      console.log(`  ${config.name}: ${count} documents`);
    }

    console.log();
    console.log('🎉 Database initialization completed successfully!');
    console.log();
    console.log('📝 Next Steps:');
    console.log('   • Users will be created automatically via SSO login');
    console.log('   • Quiz submissions will populate as mavericks take assessments');
    console.log('   • NO sample/fake data was created - production ready!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { initializeDatabase };