import type { FeedbackCompletionRepository } from './feedback-completion.js';
import {
  computeBatchCompletionPercent,
  computeSubmissionsAwayFromXpBonus,
  isBatchXpBonusEligible,
} from '../services/feedback-completion.js';
import type {
  BatchFeedbackDashboard,
  FeedbackSubmissionRecord,
} from '../types/feedback-completion.js';
import { BATCH_XP_BONUS_THRESHOLD_PERCENT } from '../types/feedback-completion.js';

const BATCH_ID = 'B-2025-13';
const ENROLLED_MAVERICKS = ['mav-001', 'mav-002', 'mav-003', 'mav-004', 'mav-005'];
const TRAINER_ID = 'tr-001';

const SESSIONS = [
  { id: 'ses-001', submitted: ['mav-001', 'mav-002', 'mav-003', 'mav-004'] },
  { id: 'ses-002', submitted: ['mav-001', 'mav-002', 'mav-003'] },
];

const submissions = new Set<string>(
  SESSIONS.flatMap((session) =>
    session.submitted.map((maverickId) => `${session.id}:${maverickId}`),
  ),
);

const xpBonusAwarded = new Set<string>();
const reminderTiersSent = {
  day0: true,
  day1: false,
  day2: false,
};

const buildDashboard = (batchId: string): BatchFeedbackDashboard | null => {
  if (batchId !== BATCH_ID) {
    return null;
  }

  const sessionStatuses = SESSIONS.map((session) => {
    const pendingMaverickIds = ENROLLED_MAVERICKS.filter(
      (maverickId) => !session.submitted.includes(maverickId),
    );

    return {
      sessionId: session.id,
      submittedCount: session.submitted.length,
      pendingCount: pendingMaverickIds.length,
      completionPercent: computeBatchCompletionPercent(
        session.submitted.length,
        ENROLLED_MAVERICKS.length,
      ),
      pendingMaverickIds,
    };
  });

  const submittedCount = submissions.size;
  const totalSlots = ENROLLED_MAVERICKS.length * SESSIONS.length;
  const completionPercent = computeBatchCompletionPercent(submittedCount, totalSlots);

  return {
    batchId,
    completionPercent,
    submittedCount,
    totalSlots,
    xpBonusThresholdPercent: BATCH_XP_BONUS_THRESHOLD_PERCENT,
    xpBonusEligible: isBatchXpBonusEligible(completionPercent),
    xpBonusAwarded: xpBonusAwarded.has(batchId),
    submissionsAwayFromXpBonus: computeSubmissionsAwayFromXpBonus(
      submittedCount,
      totalSlots,
      BATCH_XP_BONUS_THRESHOLD_PERCENT,
    ),
    sessions: sessionStatuses,
    reminderTiers: { ...reminderTiersSent },
  };
};

export const createInMemoryFeedbackCompletionRepository = (): FeedbackCompletionRepository => ({
  async getBatchDashboard(batchId: string): Promise<BatchFeedbackDashboard | null> {
    return buildDashboard(batchId);
  },

  async getBatchCohortSize(batchId: string): Promise<number> {
    if (batchId !== BATCH_ID) {
      return 0;
    }

    return ENROLLED_MAVERICKS.length;
  },

  async isTrainerForBatch(trainerId: string, batchId: string): Promise<boolean> {
    return trainerId === TRAINER_ID && batchId === BATCH_ID;
  },

  async recordFeedbackSubmission(record: FeedbackSubmissionRecord): Promise<void> {
    submissions.add(`${record.sessionId}:${record.maverickId}`);
  },

  async getBatchCompletionPercent(batchId: string): Promise<number> {
    const dashboard = buildDashboard(batchId);
    return dashboard?.completionPercent ?? 0;
  },

  async hasBatchXpBonusAwarded(batchId: string): Promise<boolean> {
    return xpBonusAwarded.has(batchId);
  },

  async markBatchXpBonusAwarded(batchId: string): Promise<void> {
    xpBonusAwarded.add(batchId);
  },
});
