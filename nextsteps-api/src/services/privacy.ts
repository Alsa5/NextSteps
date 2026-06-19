import type { BatchFeedbackDashboard } from '../types/feedback-completion.js';
import type { SanitizedBatchFeedbackDashboard, SanitizedSessionFeedbackStatus } from '../types/privacy.js';

export const DEFAULT_K_ANONYMITY_THRESHOLD = 5;

export const meetsKAnonymity = (
  cohortSize: number,
  threshold: number = DEFAULT_K_ANONYMITY_THRESHOLD,
): boolean => cohortSize >= threshold;

export const sanitizeSessionFeedbackStatus = (
  session: BatchFeedbackDashboard['sessions'][number],
): SanitizedSessionFeedbackStatus => ({
  sessionId: session.sessionId,
  submittedCount: session.submittedCount,
  pendingCount: session.pendingCount,
  completionPercent: session.completionPercent,
});

export const sanitizeBatchFeedbackDashboard = (
  dashboard: BatchFeedbackDashboard,
  cohortSize: number,
  threshold: number = DEFAULT_K_ANONYMITY_THRESHOLD,
): SanitizedBatchFeedbackDashboard => {
  const kAnonymityApplied = meetsKAnonymity(cohortSize, threshold);

  return {
    batchId: dashboard.batchId,
    completionPercent: dashboard.completionPercent,
    submittedCount: dashboard.submittedCount,
    totalSlots: dashboard.totalSlots,
    xpBonusThresholdPercent: dashboard.xpBonusThresholdPercent,
    xpBonusEligible: dashboard.xpBonusEligible,
    xpBonusAwarded: dashboard.xpBonusAwarded,
    submissionsAwayFromXpBonus: dashboard.submissionsAwayFromXpBonus,
    sessions: kAnonymityApplied
      ? dashboard.sessions.map(sanitizeSessionFeedbackStatus)
      : [],
    reminderTiers: dashboard.reminderTiers,
    privacy: 'batch-aggregate-only',
    kAnonymityApplied,
  };
};

export const containsNamedIdentifiers = (payload: unknown): boolean => {
  const serialized = JSON.stringify(payload);
  return (
    /pendingMaverickIds/i.test(serialized) ||
    /maverickId/i.test(serialized) ||
    /mav-\d+/i.test(serialized)
  );
};
