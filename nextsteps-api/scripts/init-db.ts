#!/usr/bin/env node
/**
 * MongoDB / Cosmos DB initialization for NextSteps.
 *
 * Creates collections and indexes. Safe for production — does NOT seed fake users or quizzes.
 * Role-mapping defaults are seeded idempotently.
 *
 * Cosmos: create the `nextsteps` database and collections in Azure Portal first if
 * database creation via API is disabled. Partition keys are listed per collection below.
 *
 * Usage: npm run init-db
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, type Db } from 'mongodb';
import { buildMongoClientOptions, isCosmosMongoUri } from '../src/db/mongo-connect.js';
import { NEXTSTEPS_COLLECTIONS } from '../src/db/mongo.js';
import type { RoleMapping } from '../src/db/schemas.js';
import { DEFAULT_DESIGNATION_MAPPINGS } from '../src/repositories/role-mapping-repository.js';
import { seedDemoData } from '../src/services/seed-demo-data.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'nextsteps';

interface CollectionConfig {
  name: string;
  partitionKey: string;
  description: string;
  requiredIndexes?: { fields: Record<string, 1 | -1>; options?: Record<string, unknown> }[];
}

/**
 * All collections — partitionKey is the Cosmos shard key path (Portal: "Partition key").
 */
export const REQUIRED_COLLECTIONS: CollectionConfig[] = [
  {
    name: NEXTSTEPS_COLLECTIONS.ROLE_MAPPINGS,
    partitionKey: '/type',
    description: 'Email and designation-based role mappings',
    requiredIndexes: [{ fields: { type: 1, value: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.USERS,
    partitionKey: '/email',
    description: 'User authentication and profile data',
    requiredIndexes: [{ fields: { email: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.TRAINEE_REGISTRY,
    partitionKey: '/email',
    description: 'Roster trainees — batch assignment and sign-in eligibility',
    requiredIndexes: [{ fields: { email: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.GOOGLE_OAUTH_TOKENS,
    partitionKey: '/userId',
    description: 'L&D Google Calendar / Meet OAuth refresh tokens',
    requiredIndexes: [{ fields: { userId: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.NOTIFICATIONS,
    partitionKey: '/recipientEmail',
    description: 'In-app notifications per recipient',
    requiredIndexes: [
      { fields: { recipientEmail: 1, createdAt: -1 } },
      { fields: { id: 1 }, options: { unique: true } },
    ],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.SESSIONS,
    partitionKey: '/batchId',
    description: 'Training and pre-onboarding session records',
    requiredIndexes: [
      { fields: { batchId: 1, id: 1 }, options: { unique: true } },
      { fields: { trainerId: 1 } },
      { fields: { status: 1 } },
    ],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.SESSION_TRANSCRIPTS,
    partitionKey: '/sessionId',
    description: 'Session transcripts and AI analysis (API layer)',
    requiredIndexes: [{ fields: { sessionId: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.TRANSCRIPTS,
    partitionKey: '/sessionId',
    description: 'Worker pipeline transcript storage',
    requiredIndexes: [{ fields: { sessionId: 1 } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.QUIZ_SUBMISSIONS,
    partitionKey: '/batch',
    description: 'Submitted quiz results and answers',
    requiredIndexes: [
      { fields: { batch: 1, submittedAt: -1 } },
      { fields: { maverickId: 1 } },
      { fields: { quizId: 1 } },
    ],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.QUIZZES,
    partitionKey: '/id',
    description: 'Published quiz metadata and questions',
    requiredIndexes: [
      { fields: { id: 1 }, options: { unique: true } },
      { fields: { batch: 1 } },
      { fields: { trainerEmail: 1 } },
    ],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.FEEDBACK_SUBMISSIONS,
    partitionKey: '/batchId',
    description: 'Per-session pulse/deep feedback completion records',
    requiredIndexes: [
      {
        fields: { batchId: 1, sessionId: 1, maverickId: 1 },
        options: { unique: true },
      },
    ],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.BATCH_FEEDBACK_STATE,
    partitionKey: '/batchId',
    description: 'Batch feedback XP bonus and reminder tier state',
    requiredIndexes: [{ fields: { batchId: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.AUDIT_LOGS,
    partitionKey: '/actorId',
    description: 'Privacy-sensitive resource access audit trail',
    requiredIndexes: [
      { fields: { actorId: 1, timestamp: -1 } },
      { fields: { resourceType: 1, resourceId: 1 } },
    ],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.MAVERICK_BATCH_MEMBERSHIPS,
    partitionKey: '/maverickId',
    description: 'Maverick to batch membership for session RBAC',
    requiredIndexes: [{ fields: { maverickId: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.P7_BATCH_METRICS,
    partitionKey: '/batchId',
    description: 'P7 cohort comparison metrics per batch',
    requiredIndexes: [{ fields: { batchId: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.P7_TOP_PERFORMERS,
    partitionKey: '/batchId',
    description: 'P7 top performer rankings per batch',
    requiredIndexes: [{ fields: { batchId: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.P7_REMINDER_TIMINGS,
    partitionKey: '/batchId',
    description: 'P7 optimal reminder timing per batch',
    requiredIndexes: [{ fields: { batchId: 1 }, options: { unique: true } }],
  },
  {
    name: NEXTSTEPS_COLLECTIONS.P7_CURRICULUM_RECOMMENDATIONS,
    partitionKey: '/batchId',
    description: 'P7 curriculum copilot recommendations per batch',
    requiredIndexes: [{ fields: { batchId: 1 }, options: { unique: true } }],
  },
];

export const initializeDatabase = async (): Promise<void> => {
  console.log('NextSteps Database Initialization');
  console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/[^@]+@/, '//***@')}`);
  console.log(`Database: ${MONGODB_DATABASE}`);
  console.log();

  let client: MongoClient | null = null;

  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI, buildMongoClientOptions(MONGODB_URI));
    await client.connect();

    const db: Db = client.db(MONGODB_DATABASE);
    console.log('Connected');
    console.log();

    console.log('Collections (create in Portal if API creation is disabled):');
    for (const config of REQUIRED_COLLECTIONS) {
      console.log(`  ${config.name}  →  partition key ${config.partitionKey}`);
    }
    console.log();

    const cosmos = isCosmosMongoUri(MONGODB_URI);
    const existingCollections = await db.listCollections().toArray();
    const existingNames = new Set(existingCollections.map((c) => c.name));

    if (cosmos) {
      console.log(
        'Cosmos DB detected — collections and indexes are Portal-managed; skipping createCollection/createIndex.',
      );
      console.log();

      const missing = REQUIRED_COLLECTIONS.filter((c) => !existingNames.has(c.name));
      if (missing.length > 0) {
        console.warn('Missing collections (create in Azure Portal):');
        for (const config of missing) {
          console.warn(`  - ${config.name}`);
        }
        console.log();
      } else {
        console.log(`All ${REQUIRED_COLLECTIONS.length} collections present.`);
        console.log();
      }
    } else {
      console.log('Creating collections and indexes...');

      for (const config of REQUIRED_COLLECTIONS) {
        if (!existingNames.has(config.name)) {
          try {
            await db.createCollection(config.name);
            console.log(`Created collection: ${config.name}`);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`Skipped createCollection(${config.name}): ${message}`);
          }
        } else {
          console.log(`Collection exists: ${config.name}`);
        }

        if (config.requiredIndexes) {
          const collection = db.collection(config.name);
          for (const indexConfig of config.requiredIndexes) {
            try {
              await collection.createIndex(indexConfig.fields, indexConfig.options || {});
              const indexName = Object.keys(indexConfig.fields).join('_');
              console.log(`  Index: ${config.name}.${indexName}`);
            } catch (error: unknown) {
              const err = error as { code?: number };
              const indexName = Object.keys(indexConfig.fields).join('_');
              if (err.code === 85) {
                console.log(`  Index exists: ${config.name}.${indexName}`);
              } else {
                throw error;
              }
            }
          }
        }
      }

      console.log();
    }
    console.log('Seeding role mappings...');

    let seedCount = 0;
    const roleMappingsCol = db.collection<RoleMapping>(NEXTSTEPS_COLLECTIONS.ROLE_MAPPINGS);
    const now = new Date().toISOString();

    for (const mapping of DEFAULT_DESIGNATION_MAPPINGS) {
      const value =
        mapping.type === 'email' ? mapping.value.toLowerCase() : mapping.value;
      const existing = await roleMappingsCol.findOne({ type: mapping.type, value });
      if (!existing) {
        await roleMappingsCol.insertOne({
          _id: randomUUID(),
          ...mapping,
          value,
          createdAt: now,
        });
        seedCount++;
        console.log(`Added role mapping: ${mapping.type}=${mapping.value} → ${mapping.role}`);
      }
    }

    if (seedCount > 0) {
      console.log(`Seeded ${seedCount} role mappings`);
    } else {
      console.log('All role mappings already exist');
    }

    console.log();
    console.log('Seeding demo data...');
    await seedDemoData(db);

    console.log();
    console.log('Database statistics:');
    for (const config of REQUIRED_COLLECTIONS) {
      const count = await db.collection(config.name).countDocuments();
      console.log(`  ${config.name}: ${count} documents`);
    }

    console.log();
    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isDirectRun) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
