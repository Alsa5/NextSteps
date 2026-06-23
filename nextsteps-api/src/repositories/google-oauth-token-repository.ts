import type { Collection } from 'mongodb';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';

export interface GoogleOAuthTokenRecord {
  userId: string;
  email: string;
  refreshToken: string;
  scopes: string[];
  updatedAt: Date;
}

export interface GoogleOAuthTokenRepository {
  upsert(record: GoogleOAuthTokenRecord): Promise<void>;
  findByUserId(userId: string): Promise<GoogleOAuthTokenRecord | null>;
  deleteByUserId(userId: string): Promise<void>;
}

const COLLECTION = NEXTSTEPS_COLLECTIONS.GOOGLE_OAUTH_TOKENS;

export const createGoogleOAuthTokenRepository = (): GoogleOAuthTokenRepository => {
  const collection = (): Collection<GoogleOAuthTokenRecord> =>
    getDb().collection<GoogleOAuthTokenRecord>(COLLECTION);

  return {
    async upsert(record) {
      await collection().updateOne(
        { userId: record.userId },
        { $set: { ...record, updatedAt: new Date() } },
        { upsert: true },
      );
    },

    async findByUserId(userId) {
      return collection().findOne({ userId });
    },

    async deleteByUserId(userId) {
      await collection().deleteOne({ userId });
    },
  };
};
