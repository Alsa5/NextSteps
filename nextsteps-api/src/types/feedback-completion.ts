export type ReminderTier = 0 | 1 | 2;

export interface FeedbackSubmissionRecord {
  sessionId: string;
  maverickId: string;
  submittedAt: string;
}

export interface SessionFeedbackStatus {
  sessionId: string;
  submittedCount: number;
  pendingCount: number;
  completionPercent: number;
  pendingMaverickIds: string[];
}

export interface BatchFeedbackDashboard {
  batchId: string;
  completionPercent: number;
  submittedCount: number;
  totalSlots: number;
  xpBonusThresholdPercent: number;
  xpBonusEligible: boolean;
  xpBonusAwarded: boolean;
  submissionsAwayFromXpBonus: number;
  sessions: SessionFeedbackStatus[];
  reminderTiers: {
    day0: boolean;
    day1: boolean;
    day2: boolean;
  };
}

export interface BatchFeedbackDashboardResponse extends BatchFeedbackDashboard {
  privacy: 'batch-aggregate-only';
}

export const BATCH_XP_BONUS_THRESHOLD_PERCENT = 90;
export const BATCH_XP_BONUS_AMOUNT = 200;
