#!/usr/bin/env node
/**
 * Seed demo data into all NextSteps Mongo collections (idempotent).
 * Safe to run against local Mongo or Cosmos after Portal provisioning.
 *
 * Usage: npm run seed-db
 */

import 'dotenv/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { buildMongoClientOptions } from '../src/db/mongo-connect.js';
import { seedDemoData } from '../src/services/seed-demo-data.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'nextsteps';

const run = async (): Promise<void> => {
  console.log('NextSteps demo data seed');
  console.log(`Database: ${MONGODB_DATABASE}`);
  console.log();

  const client = new MongoClient(MONGODB_URI, buildMongoClientOptions(MONGODB_URI));
  await client.connect();
  const db = client.db(MONGODB_DATABASE);

  try {
    await seedDemoData(db);
    console.log();
    console.log('Seed completed.');
  } finally {
    await client.close();
  }
};

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isDirectRun) {
  run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export { run as seedDatabase };
