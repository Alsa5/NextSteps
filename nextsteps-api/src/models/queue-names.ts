export const JOB_INGEST_MEET_TRANSCRIPT = 'ingest-meet-transcript';
export const JOB_ANALYZE_SESSION_SENTIMENT = 'analyze-session-sentiment';
export const JOB_SEND_FEEDBACK_REMINDER = 'send-feedback-reminder';
export const JOB_EVALUATE_BATCH_XP_BONUS = 'evaluate-batch-xp-bonus';
export const JOB_GENERATE_EXECUTIVE_REPORT = 'generate-executive-report';
export const JOB_COMPUTE_REMINDER_TIMING = 'compute-reminder-timing';

export interface IngestMeetTranscriptPayload {
  sessionId: string;
  meetConferenceId?: string;
}

export interface AnalyzeSessionSentimentPayload {
  sessionId: string;
  transcriptId: string;
}

export interface SendFeedbackReminderPayload {
  sessionId: string;
  batchId: string;
  tier: 0 | 1 | 2;
  pendingMaverickIds: string[];
  trainerId?: string;
}

export interface EvaluateBatchXpBonusPayload {
  batchId: string;
  sessionId?: string;
}

export const JOB_PURGE_EXPIRED_DATA = 'purge-expired-data';

export interface PurgeExpiredDataPayload {
  triggeredAt?: string;
}

export interface GenerateExecutiveReportPayload {
  batchId: string;
  format: 'pdf' | 'excel';
}

export interface ComputeReminderTimingPayload {
  batchId: string;
}
