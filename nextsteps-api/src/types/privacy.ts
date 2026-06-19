export type SensitiveResourceType =
  | 'transcript-summary'
  | 'session-analytics'
  | 'feedback-dashboard'
  | 'skill-profile'
  | 'document';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  resourceType: SensitiveResourceType;
  resourceId: string;
  action: 'read';
  route: string;
}

export interface SanitizedSessionFeedbackStatus {
  sessionId: string;
  submittedCount: number;
  pendingCount: number;
  completionPercent: number;
}

export interface SanitizedBatchFeedbackDashboard {
  batchId: string;
  completionPercent: number;
  submittedCount: number;
  totalSlots: number;
  xpBonusThresholdPercent: number;
  xpBonusEligible: boolean;
  xpBonusAwarded: boolean;
  submissionsAwayFromXpBonus: number;
  sessions: SanitizedSessionFeedbackStatus[];
  reminderTiers: {
    day0: boolean;
    day1: boolean;
    day2: boolean;
  };
  privacy: 'batch-aggregate-only';
  kAnonymityApplied: boolean;
}
