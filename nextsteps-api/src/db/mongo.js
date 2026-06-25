import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';
import { buildMongoClientOptions, validateMongoUri } from './mongo-connect.js';
let client = null;
let db = null;
/** Cosmos / Mongo collection names — partition keys documented in scripts/init-db.ts */
export const NEXTSTEPS_COLLECTIONS = {
    USERS: 'users',
    ROLE_MAPPINGS: 'role_mappings',
    TRAINEE_REGISTRY: 'trainee_registry',
    GOOGLE_OAUTH_TOKENS: 'google_oauth_tokens',
    NOTIFICATIONS: 'notifications',
    SESSIONS: 'sessions',
    SESSION_TRANSCRIPTS: 'session_transcripts',
    TRANSCRIPTS: 'transcripts',
    QUIZ_SUBMISSIONS: 'quiz_submissions',
    QUIZZES: 'quizzes',
    FEEDBACK_SUBMISSIONS: 'feedback_submissions',
    BATCH_FEEDBACK_STATE: 'batch_feedback_state',
    AUDIT_LOGS: 'audit_logs',
    MAVERICK_BATCH_MEMBERSHIPS: 'maverick_batch_memberships',
    P7_BATCH_METRICS: 'p7_batch_metrics',
    P7_TOP_PERFORMERS: 'p7_top_performers',
    P7_REMINDER_TIMINGS: 'p7_reminder_timings',
    P7_CURRICULUM_RECOMMENDATIONS: 'p7_curriculum_recommendations',
};
export const connectMongo = async () => {
    if (db)
        return db;
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
export const getDb = () => {
    if (!db) {
        throw new Error('MongoDB not connected. Call connectMongo() first.');
    }
    return db;
};
export const closeMongo = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
};
