import type { AuditLogEntry, SensitiveResourceType } from '../types/privacy.js';

export interface AuditLogRecordInput {
  actorId: string;
  actorRole: string;
  resourceType: SensitiveResourceType;
  resourceId: string;
  action: 'read';
  route: string;
}

export interface AuditLogRepository {
  log(entry: AuditLogRecordInput): Promise<AuditLogEntry>;
  findByResource(resourceType: SensitiveResourceType, resourceId: string): Promise<AuditLogEntry[]>;
  findByActor(actorId: string): Promise<AuditLogEntry[]>;
  getAll(): Promise<AuditLogEntry[]>;
}
