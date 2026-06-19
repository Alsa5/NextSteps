export const FEEDBACK_RETENTION_MONTHS = 24;
export const TRANSCRIPT_RAW_RETENTION_DAYS = 90;
export const AI_COPILOT_LOG_RETENTION_DAYS = 30;

export interface PurgeExpiredDataResult {
  feedbackRecordsPurged: number;
  transcriptRawPurged: number;
  aiCopilotLogsPurged: number;
  executedAt: string;
}

export interface PurgeExpiredDataDeps {
  purgeFeedbackOlderThanMonths: (months: number) => Promise<number>;
  purgeTranscriptRawOlderThanDays: (days: number) => Promise<number>;
  purgeAiCopilotLogsOlderThanDays: (days: number) => Promise<number>;
}

export const createPurgeExpiredDataHandler =
  (deps: PurgeExpiredDataDeps) =>
  async (): Promise<PurgeExpiredDataResult> => {
    const feedbackRecordsPurged = await deps.purgeFeedbackOlderThanMonths(
      FEEDBACK_RETENTION_MONTHS,
    );
    const transcriptRawPurged = await deps.purgeTranscriptRawOlderThanDays(
      TRANSCRIPT_RAW_RETENTION_DAYS,
    );
    const aiCopilotLogsPurged = await deps.purgeAiCopilotLogsOlderThanDays(
      AI_COPILOT_LOG_RETENTION_DAYS,
    );

    return {
      feedbackRecordsPurged,
      transcriptRawPurged,
      aiCopilotLogsPurged,
      executedAt: new Date().toISOString(),
    };
  };

export const createStubPurgeExpiredDataDeps = (): PurgeExpiredDataDeps => ({
  async purgeFeedbackOlderThanMonths() {
    return 0;
  },
  async purgeTranscriptRawOlderThanDays() {
    return 0;
  },
  async purgeAiCopilotLogsOlderThanDays() {
    return 0;
  },
});
