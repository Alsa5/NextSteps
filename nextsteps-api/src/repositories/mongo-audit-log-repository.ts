import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { AuditLogEntry } from '../types/privacy.js';
import type { AuditLogRecordInput, AuditLogRepository } from './audit-log.js';

export const createMongoAuditLogRepository = (): AuditLogRepository => {
  const collection = (): Collection<AuditLogEntry> =>
    getDb().collection<AuditLogEntry>(NEXTSTEPS_COLLECTIONS.AUDIT_LOGS);

  return {
    async log(input) {
      const entry: AuditLogEntry = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ...input,
      };
      await collection().insertOne(entry);
      return entry;
    },

    async findByResource(resourceType, resourceId) {
      return collection()
        .find({ resourceType, resourceId })
        .sort({ timestamp: -1 })
        .toArray();
    },

    async findByActor(actorId) {
      return collection().find({ actorId }).sort({ timestamp: -1 }).toArray();
    },

    async getAll() {
      return collection().find({}).sort({ timestamp: -1 }).toArray();
    },
  };
};
