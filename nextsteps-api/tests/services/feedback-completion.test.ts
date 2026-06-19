import { describe, expect, it } from 'vitest';
import {
  computeBatchCompletionPercent,
  isBatchXpBonusEligible,
  resolveReminderTier,
} from '../../src/services/feedback-completion.js';

describe('feedback-completion service', () => {
  describe('computeBatchCompletionPercent', () => {
    it('returns 0 when no submissions exist', () => {
      expect(computeBatchCompletionPercent(0, 10)).toBe(0);
    });

    it('returns rounded percent for partial completion', () => {
      expect(computeBatchCompletionPercent(7, 10)).toBe(70);
    });

    it('returns 100 when all slots are filled', () => {
      expect(computeBatchCompletionPercent(10, 10)).toBe(100);
    });
  });

  describe('resolveReminderTier', () => {
    it('returns tier 0 on session end day', () => {
      expect(resolveReminderTier(0)).toBe(0);
    });

    it('returns tier 1 on day 1 after session end', () => {
      expect(resolveReminderTier(1)).toBe(1);
    });

    it('returns tier 2 on day 2 after session end', () => {
      expect(resolveReminderTier(2)).toBe(2);
    });

    it('returns null after the 3-tier window', () => {
      expect(resolveReminderTier(3)).toBeNull();
    });
  });

  describe('isBatchXpBonusEligible', () => {
    it('is eligible at exactly 90 percent', () => {
      expect(isBatchXpBonusEligible(90)).toBe(true);
    });

    it('is eligible above 90 percent', () => {
      expect(isBatchXpBonusEligible(95)).toBe(true);
    });

    it('is not eligible below 90 percent', () => {
      expect(isBatchXpBonusEligible(89)).toBe(false);
    });
  });
});
