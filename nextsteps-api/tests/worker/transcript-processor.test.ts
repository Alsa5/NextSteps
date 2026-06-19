import { describe, expect, it } from 'vitest';
import {
  buildSummary,
  detectConfusionTimestamps,
  extractKeyTerms,
} from '../../src/worker/services/transcript-processor.js';

describe('transcript processor', () => {
  const payload = {
    rawText: 'OOP session with interface vs abstract class confusion at 34:00.',
    segments: [
      { startOffset: '00:00', text: 'Covered core OOP concepts.' },
      {
        startOffset: '34:00',
        text: 'Interface vs Abstract Class questions caused confusion.',
      },
    ],
  };

  it('builds summary bullets from segments', () => {
    expect(buildSummary(payload)).toEqual([
      'Covered core OOP concepts.',
      'Interface vs Abstract Class questions caused confusion.',
    ]);
  });

  it('extracts capitalized key terms', () => {
    expect(extractKeyTerms(payload)).toContain('Interface');
  });

  it('detects confusion timestamps from segment keywords', () => {
    const timestamps = detectConfusionTimestamps(payload);
    expect(timestamps).toHaveLength(1);
    expect(timestamps[0].time).toBe('34:00');
    expect(timestamps[0].clarityDip).toBeGreaterThan(0);
  });
});
