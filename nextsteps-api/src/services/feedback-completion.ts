import type { ReminderTier } from '../types/feedback-completion.js';

export const computeBatchCompletionPercent = (
  submittedCount: number,
  totalSlots: number,
): number => {
  if (totalSlots <= 0) {
    return 0;
  }

  return Math.round((submittedCount / totalSlots) * 100);
};

export const resolveReminderTier = (daysSinceSessionEnd: number): ReminderTier | null => {
  if (daysSinceSessionEnd < 0 || daysSinceSessionEnd > 2) {
    return null;
  }

  return daysSinceSessionEnd as ReminderTier;
};

export const isBatchXpBonusEligible = (completionPercent: number): boolean =>
  completionPercent >= 90;

export const computeSubmissionsAwayFromXpBonus = (
  submittedCount: number,
  totalSlots: number,
  thresholdPercent: number,
): number => {
  const requiredSubmissions = Math.ceil((thresholdPercent / 100) * totalSlots);
  return Math.max(0, requiredSubmissions - submittedCount);
};
