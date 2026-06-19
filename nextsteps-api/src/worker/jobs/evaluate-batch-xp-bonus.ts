import { BATCH_XP_BONUS_AMOUNT } from '../../types/feedback-completion.js';
import { isBatchXpBonusEligible } from '../../services/feedback-completion.js';

export interface EvaluateBatchXpBonusPayload {
  batchId: string;
  sessionId?: string;
}

export interface EvaluateBatchXpBonusResult {
  batchId: string;
  awarded: boolean;
  xpAmount?: number;
  recipientCount?: number;
  reason?: 'below-threshold' | 'already-awarded';
}

export interface EvaluateBatchXpBonusDeps {
  getBatchCompletionPercent(batchId: string): Promise<number>;
  hasBatchXpBonusAwarded(batchId: string): Promise<boolean>;
  awardBatchXpBonus(batchId: string): Promise<{ xpAmount: number; recipientCount: number }>;
}

export const createEvaluateBatchXpBonusHandler =
  (deps: EvaluateBatchXpBonusDeps) =>
  async (payload: EvaluateBatchXpBonusPayload): Promise<EvaluateBatchXpBonusResult> => {
    if (await deps.hasBatchXpBonusAwarded(payload.batchId)) {
      return { batchId: payload.batchId, awarded: false, reason: 'already-awarded' };
    }

    const completionPercent = await deps.getBatchCompletionPercent(payload.batchId);
    if (!isBatchXpBonusEligible(completionPercent)) {
      return { batchId: payload.batchId, awarded: false, reason: 'below-threshold' };
    }

    const award = await deps.awardBatchXpBonus(payload.batchId);
    return {
      batchId: payload.batchId,
      awarded: true,
      xpAmount: award.xpAmount,
      recipientCount: award.recipientCount,
    };
  };

import type { FeedbackCompletionRepository } from '../../repositories/feedback-completion.js';

export const buildEvaluateBatchXpBonusDepsFromRepository = (
  repo: FeedbackCompletionRepository,
): EvaluateBatchXpBonusDeps => ({
  getBatchCompletionPercent: (batchId) => repo.getBatchCompletionPercent(batchId),
  hasBatchXpBonusAwarded: (batchId) => repo.hasBatchXpBonusAwarded(batchId),
  awardBatchXpBonus: async (batchId) => {
    await repo.markBatchXpBonusAwarded(batchId);
    return { xpAmount: BATCH_XP_BONUS_AMOUNT, recipientCount: 5 };
  },
});
