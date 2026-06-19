import { describe, expect, it, vi } from 'vitest';
import {
  createEvaluateBatchXpBonusHandler,
  type EvaluateBatchXpBonusDeps,
} from '../../src/worker/jobs/evaluate-batch-xp-bonus.js';

const createDeps = (overrides: Partial<EvaluateBatchXpBonusDeps> = {}): EvaluateBatchXpBonusDeps => ({
  getBatchCompletionPercent: vi.fn(async () => 92),
  hasBatchXpBonusAwarded: vi.fn(async () => false),
  awardBatchXpBonus: vi.fn(async () => ({ xpAmount: 200, recipientCount: 5 })),
  ...overrides,
});

describe('evaluate-batch-xp-bonus job', () => {
  it('awards batch XP when completion reaches 90 percent and bonus not yet granted', async () => {
    const deps = createDeps();
    const handler = createEvaluateBatchXpBonusHandler(deps);

    const result = await handler({ batchId: 'B-2025-13', sessionId: 'ses-001' });

    expect(result.awarded).toBe(true);
    expect(result.xpAmount).toBe(200);
    expect(deps.awardBatchXpBonus).toHaveBeenCalledWith('B-2025-13');
  });

  it('skips when completion is below threshold', async () => {
    const deps = createDeps({
      getBatchCompletionPercent: vi.fn(async () => 85),
    });
    const handler = createEvaluateBatchXpBonusHandler(deps);

    const result = await handler({ batchId: 'B-2025-13' });

    expect(result.awarded).toBe(false);
    expect(result.reason).toBe('below-threshold');
    expect(deps.awardBatchXpBonus).not.toHaveBeenCalled();
  });

  it('skips when bonus was already awarded', async () => {
    const deps = createDeps({
      hasBatchXpBonusAwarded: vi.fn(async () => true),
    });
    const handler = createEvaluateBatchXpBonusHandler(deps);

    const result = await handler({ batchId: 'B-2025-13' });

    expect(result.awarded).toBe(false);
    expect(result.reason).toBe('already-awarded');
    expect(deps.awardBatchXpBonus).not.toHaveBeenCalled();
  });
});
