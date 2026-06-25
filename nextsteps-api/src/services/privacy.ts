import type { BatchFeedbackDashboard } from '../types/feedback-completion.js';
import type { SanitizedBatchFeedbackDashboard, SanitizedSessionFeedbackStatus } from '../types/privacy.js';
import type { 
  SessionFeedbackSubmission, 
  SanitizedSessionFeedback, 
  DetailedSessionFeedback,
  MoodType 
} from '../types/session-feedback.js';

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

/**
 * Sanitize session feedback for trainer consumption following k-anonymity principles.
 * Strips all individual identity, provides only aggregate statistics.
 */
export const sanitizeFeedbackForTrainer = (
  submissions: SessionFeedbackSubmission[],
  sessionId: string,
  batchId: string,
  trainerEmail: string,
  threshold: number = DEFAULT_K_ANONYMITY_THRESHOLD,
): SanitizedSessionFeedback => {
  const totalResponses = submissions.length;
  const kAnonymityApplied = meetsKAnonymity(totalResponses, threshold);

  // Calculate aggregate stats
  const moodDistribution: Record<MoodType, number> = {
    great: 0,
    good: 0,
    okay: 0,
    confused: 0,
  };

  let totalClarity = 0;
  let totalPace = 0;
  const comments: string[] = [];

  submissions.forEach(submission => {
    moodDistribution[submission.mood]++;
    totalClarity += submission.clarity;
    totalPace += submission.pace;
    if (submission.openText?.trim()) {
      comments.push(submission.openText.trim());
    }
  });

  const averageClarity = totalResponses > 0 ? +(totalClarity / totalResponses).toFixed(1) : 0;
  const averagePace = totalResponses > 0 ? +(totalPace / totalResponses).toFixed(1) : 0;

  return {
    sessionId,
    batchId,
    trainerEmail,
    aggregateStats: {
      totalResponses,
      moodDistribution,
      averageClarity,
      averagePace,
    },
    comments: kAnonymityApplied ? comments : [], // No comments if too few responses
    privacy: 'trainer-aggregate-only',
    kAnonymityApplied,
    lowSampleSize: !kAnonymityApplied,
  };
};

/**
 * Prepare detailed feedback for L&D consumption with full individual identity.
 */
export const prepareFeedbackForLD = (
  submissions: SessionFeedbackSubmission[],
  sessionId: string,
  batchId: string,
  trainerEmail: string,
): DetailedSessionFeedback => {
  const totalResponses = submissions.length;

  // Calculate aggregate stats (same as trainer view)
  const moodDistribution: Record<MoodType, number> = {
    great: 0,
    good: 0,
    okay: 0,
    confused: 0,
  };

  let totalClarity = 0;
  let totalPace = 0;

  submissions.forEach(submission => {
    moodDistribution[submission.mood]++;
    totalClarity += submission.clarity;
    totalPace += submission.pace;
  });

  const averageClarity = totalResponses > 0 ? +(totalClarity / totalResponses).toFixed(1) : 0;
  const averagePace = totalResponses > 0 ? +(totalPace / totalResponses).toFixed(1) : 0;

  // Include full individual responses for L&D
  const individualResponses = submissions.map(submission => ({
    maverickId: submission.maverickId,
    maverickName: submission.maverickName,
    mood: submission.mood,
    clarity: submission.clarity,
    pace: submission.pace,
    openText: submission.openText,
    submittedAt: submission.submittedAt,
  }));

  return {
    sessionId,
    batchId,
    trainerEmail,
    aggregateStats: {
      totalResponses,
      moodDistribution,
      averageClarity,
      averagePace,
    },
    individualResponses,
    privacy: 'ld-full-detail',
  };
};
