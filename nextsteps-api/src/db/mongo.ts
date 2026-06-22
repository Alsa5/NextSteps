import { MongoClient, type Db } from 'mongodb';
import { env } from '../config/env.js';
import { buildMongoClientOptions, validateMongoUri } from './mongo-connect.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export const NEXTSTEPS_COLLECTIONS = {
  USERS: 'users',
  ROLE_MAPPINGS: 'role_mappings',
  TRAINEE_REGISTRY: 'trainee_registry',
} as const;

export const connectMongo = async (): Promise<Db> => {
  if (db) return db;

  const uri = env.MongoDbUri.trim();
  validateMongoUri(uri);

  client = new MongoClient(uri, buildMongoClientOptions(uri));
  await client.connect();
  db = client.db(env.MongoDbDatabase);

  if (buildMongoClientOptions(uri).tls) {
    await client.db('admin').command({ ping: 1 });
  }

  return db;
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongo() first.');
  }
  return db;
};

export const closeMongo = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};
