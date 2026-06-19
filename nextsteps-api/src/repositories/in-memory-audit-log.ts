import type { AuditLogEntry } from '../types/privacy.js';
import type { AuditLogRecordInput, AuditLogRepository } from './audit-log.js';

let entryCounter = 0;

export const createInMemoryAuditLogRepository = (): AuditLogRepository => {
  const entries: AuditLogEntry[] = [];

  return {
    async log(input: AuditLogRecordInput): Promise<AuditLogEntry> {
      entryCounter += 1;
      const entry: AuditLogEntry = {
        id: `audit-${entryCounter}`,
        timestamp: new Date().toISOString(),
        ...input,
      };
      entries.push(entry);
      return entry;
    },

    async findByResource(
      resourceType: AuditLogEntry['resourceType'],
      resourceId: string,
    ): Promise<AuditLogEntry[]> {
      return entries.filter(
        (entry) => entry.resourceType === resourceType && entry.resourceId === resourceId,
      );
    },

    async findByActor(actorId: string): Promise<AuditLogEntry[]> {
      return entries.filter((entry) => entry.actorId === actorId);
    },

    async getAll(): Promise<AuditLogEntry[]> {
      return [...entries];
    },
  };
};
