import type { AuditLogRecordInput, AuditLogRepository } from '../repositories/audit-log.js';
import type { SensitiveResourceType } from '../types/privacy.js';

export interface AuditContext {
  actorId: string;
  actorRole: string;
  route: string;
}

export const createAuditService = (auditLog: AuditLogRepository) => ({
  async logSensitiveRead(
    context: AuditContext,
    resourceType: SensitiveResourceType,
    resourceId: string,
  ): Promise<void> {
    const entry: AuditLogRecordInput = {
      actorId: context.actorId,
      actorRole: context.actorRole,
      resourceType,
      resourceId,
      action: 'read',
      route: context.route,
    };
    await auditLog.log(entry);
  },
});

export type AuditService = ReturnType<typeof createAuditService>;
