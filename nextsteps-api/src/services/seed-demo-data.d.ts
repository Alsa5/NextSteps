import { type Db } from 'mongodb';
/** Idempotent demo seed for all Mongo collections (local or Cosmos). */
export declare const seedDemoData: (db: Db) => Promise<void>;
