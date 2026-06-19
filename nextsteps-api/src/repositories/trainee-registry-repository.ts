import { randomUUID } from 'crypto';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';

export interface TraineeRegistryEntry {
  _id: string;
  email: string;
  fullName: string;
  batch: string | null;
  status: string;
  signInEligible: boolean;
  externalId?: string;
  updatedAt: string;
}

export interface TraineeRegistryUpsert {
  email: string;
  fullName: string;
  batch: string | null;
  status: string;
  externalId?: string;
}

export interface TraineeRegistryRepository {
  findByEmail(email: string): Promise<TraineeRegistryEntry | null>;
  upsert(entry: TraineeRegistryUpsert): Promise<TraineeRegistryEntry>;
  upsertMany(entries: TraineeRegistryUpsert[]): Promise<number>;
}

export const isTraineeSignInEligible = (batch: string | null | undefined): boolean =>
  Boolean(batch && String(batch).trim());

export const createTraineeRegistryRepository = (): TraineeRegistryRepository => {
  const collection = () =>
    getDb().collection<TraineeRegistryEntry>(NEXTSTEPS_COLLECTIONS.TRAINEE_REGISTRY);

  return {
    async findByEmail(email) {
      const normalized = email.trim().toLowerCase();
      return collection().findOne({
        email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
    },

    async upsert(entry) {
      const normalized = entry.email.trim().toLowerCase();
      const now = new Date().toISOString();
      const signInEligible = isTraineeSignInEligible(entry.batch);
      const existing = await this.findByEmail(normalized);

      if (existing) {
        const updated: TraineeRegistryEntry = {
          ...existing,
          email: normalized,
          fullName: entry.fullName,
          batch: entry.batch,
          status: entry.status,
          signInEligible,
          externalId: entry.externalId ?? existing.externalId,
          updatedAt: now,
        };
        await collection().updateOne({ _id: existing._id }, { $set: updated });
        return updated;
      }

      const doc: TraineeRegistryEntry = {
        _id: randomUUID(),
        email: normalized,
        fullName: entry.fullName,
        batch: entry.batch,
        status: entry.status,
        signInEligible,
        externalId: entry.externalId,
        updatedAt: now,
      };
      await collection().insertOne(doc);
      return doc;
    },

    async upsertMany(entries) {
      let count = 0;
      for (const entry of entries) {
        await this.upsert(entry);
        count += 1;
      }
      return count;
    },
  };
};
