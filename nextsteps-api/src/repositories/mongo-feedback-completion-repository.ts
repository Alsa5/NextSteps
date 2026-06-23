import type { Collection } from 'mongodb';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
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
import type { FeedbackCompletionRepository } from './feedback-completion.js';
import type { SessionRecord } from '../types/analytics.js';

interface BatchFeedbackStateDoc {
  batchId: string;
  trainerId: string;
  enrolledMaverickIds: string[];
  xpBonusAwarded: boolean;
  reminderTiers: { day0: boolean; day1: boolean; day2: boolean };
}

interface FeedbackSubmissionDoc extends FeedbackSubmissionRecord {
  batchId: string;
}

const stateCollection = (): Collection<BatchFeedbackStateDoc> =>
  getDb().collection<BatchFeedbackStateDoc>(NEXTSTEPS_COLLECTIONS.BATCH_FEEDBACK_STATE);

const submissionCollection = (): Collection<FeedbackSubmissionDoc> =>
  getDb().collection<FeedbackSubmissionDoc>(NEXTSTEPS_COLLECTIONS.FEEDBACK_SUBMISSIONS);

const sessionsCollection = (): Collection<SessionRecord> =>
  getDb().collection<SessionRecord>(NEXTSTEPS_COLLECTIONS.SESSIONS);

const buildDashboard = async (batchId: string): Promise<BatchFeedbackDashboard | null> => {
  const state = await stateCollection().findOne({ batchId });
  if (!state) {
    return null;
  }

  const batchSessions = await sessionsCollection()
    .find({ batchId })
    .project({ id: 1 })
    .toArray();

  const sessionIds = batchSessions.map((s) => s.id);
  const submissions = await submissionCollection().find({ batchId }).toArray();
  const submittedBySession = new Map<string, Set<string>>();

  for (const sub of submissions) {
    if (!submittedBySession.has(sub.sessionId)) {
      submittedBySession.set(sub.sessionId, new Set());
    }
    submittedBySession.get(sub.sessionId)!.add(sub.maverickId);
  }

  const sessionStatuses = sessionIds.map((sessionId) => {
    const submitted = submittedBySession.get(sessionId) ?? new Set<string>();
    const pendingMaverickIds = state.enrolledMaverickIds.filter((id) => !submitted.has(id));

    return {
      sessionId,
      submittedCount: submitted.size,
      pendingCount: pendingMaverickIds.length,
      completionPercent: computeBatchCompletionPercent(
        submitted.size,
        state.enrolledMaverickIds.length,
      ),
      pendingMaverickIds,
    };
  });

  const submittedCount = submissions.length;
  const totalSlots = state.enrolledMaverickIds.length * Math.max(sessionIds.length, 1);
  const completionPercent = computeBatchCompletionPercent(submittedCount, totalSlots);

  return {
    batchId,
    completionPercent,
    submittedCount,
    totalSlots,
    xpBonusThresholdPercent: BATCH_XP_BONUS_THRESHOLD_PERCENT,
    xpBonusEligible: isBatchXpBonusEligible(completionPercent),
    xpBonusAwarded: state.xpBonusAwarded,
    submissionsAwayFromXpBonus: computeSubmissionsAwayFromXpBonus(
      submittedCount,
      totalSlots,
      BATCH_XP_BONUS_THRESHOLD_PERCENT,
    ),
    sessions: sessionStatuses,
    reminderTiers: { ...state.reminderTiers },
  };
};

export const createMongoFeedbackCompletionRepository = (): FeedbackCompletionRepository => ({
  async getBatchDashboard(batchId) {
    return buildDashboard(batchId);
  },

  async getBatchCohortSize(batchId) {
    const state = await stateCollection().findOne({ batchId });
    return state?.enrolledMaverickIds.length ?? 0;
  },

  async isTrainerForBatch(trainerId, batchId) {
    const state = await stateCollection().findOne({ batchId });
    return state?.trainerId === trainerId;
  },

  async recordFeedbackSubmission(record) {
    const session = await sessionsCollection().findOne({ id: record.sessionId });
    if (!session) {
      return;
    }

    await submissionCollection().updateOne(
      {
        batchId: session.batchId,
        sessionId: record.sessionId,
        maverickId: record.maverickId,
      },
      {
        $set: {
          batchId: session.batchId,
          sessionId: record.sessionId,
          maverickId: record.maverickId,
          submittedAt: record.submittedAt,
        },
      },
      { upsert: true },
    );
  },

  async getBatchCompletionPercent(batchId) {
    const dashboard = await buildDashboard(batchId);
    return dashboard?.completionPercent ?? 0;
  },

  async hasBatchXpBonusAwarded(batchId) {
    const state = await stateCollection().findOne({ batchId });
    return state?.xpBonusAwarded ?? false;
  },

  async markBatchXpBonusAwarded(batchId) {
    await stateCollection().updateOne(
      { batchId },
      { $set: { xpBonusAwarded: true } },
      { upsert: true },
    );
  },
});
