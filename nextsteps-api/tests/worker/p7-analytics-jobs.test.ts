import { describe, expect, it } from 'vitest';
import {
  computeOptimalHour,
  createComputeReminderTimingHandler,
  createStubComputeReminderTimingDeps,
} from '../../src/worker/jobs/compute-reminder-timing.js';
import {
  createGenerateExecutiveReportHandler,
  createStubGenerateExecutiveReportDeps,
} from '../../src/worker/jobs/generate-executive-report.js';

describe('compute-reminder-timing job (G-07)', () => {
  it('returns optimal send windows from engagement history', async () => {
    const handler = createComputeReminderTimingHandler(createStubComputeReminderTimingDeps());

    const result = await handler({ batchId: 'B-2025-13' });

    expect(result.batchId).toBe('B-2025-13');
    expect(result.modelVersion).toBe('stub-v1');
    expect(result.maverickTimings).toHaveLength(2);
    expect(result.maverickTimings[0].preferredChannel).toBe('email');
  });

  it('shifts hour when engagement is below threshold', () => {
    expect(computeOptimalHour(0.82, 14)).toBe(14);
    expect(computeOptimalHour(0.5, 14)).toBe(16);
    expect(computeOptimalHour(0.5, 23)).toBe(1);
  });
});

describe('generate-executive-report job (G-06)', () => {
  it('builds narrative paragraphs and download URL', async () => {
    const handler = createGenerateExecutiveReportHandler(createStubGenerateExecutiveReportDeps());

    const result = await handler({ batchId: 'B-2025-13', format: 'pdf' });

    expect(result.batchId).toBe('B-2025-13');
    expect(result.format).toBe('pdf');
    expect(result.narrativeParagraphs).toHaveLength(3);
    expect(result.downloadUrl).toContain('B-2025-13.pdf');
  });
});
