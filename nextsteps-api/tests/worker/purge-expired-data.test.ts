import { describe, expect, it } from 'vitest';
import {
  createPurgeExpiredDataHandler,
  createStubPurgeExpiredDataDeps,
  FEEDBACK_RETENTION_MONTHS,
  TRANSCRIPT_RAW_RETENTION_DAYS,
  AI_COPILOT_LOG_RETENTION_DAYS,
} from '../../src/worker/jobs/purge-expired-data.js';

describe('purge-expired-data job (G-08 retention)', () => {
  it('executes retention purge with spec §6.4 defaults', async () => {
    const handler = createPurgeExpiredDataHandler(createStubPurgeExpiredDataDeps());
    const result = await handler();

    expect(result.feedbackRecordsPurged).toBe(0);
    expect(result.transcriptRawPurged).toBe(0);
    expect(result.aiCopilotLogsPurged).toBe(0);
    expect(result.executedAt).toBeTruthy();
  });

  it('uses spec retention windows', () => {
    expect(FEEDBACK_RETENTION_MONTHS).toBe(24);
    expect(TRANSCRIPT_RAW_RETENTION_DAYS).toBe(90);
    expect(AI_COPILOT_LOG_RETENTION_DAYS).toBe(30);
  });
});
