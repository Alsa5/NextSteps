import { getDb } from '../db/mongo.js';
import { seedDemoData } from './seed-demo-data.js';

/** Idempotent dev/demo seed for Mongo-backed repositories (non-production app bootstrap). */
export const seedDevMongoData = async (): Promise<void> => {
  await seedDemoData(getDb());
};
