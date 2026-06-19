import { describe, expect, it, vi } from 'vitest';
import {
  createIngestMeetTranscriptHandler,
  type IngestMeetTranscriptDeps,
} from '../../src/worker/jobs/ingest-meet-transcript.js';
import type { MeetTranscriptPayload } from '../../src/worker/clients/google-meet-client.js';
import type { TranscriptDocument } from '../../src/worker/models/transcript.js';

const fixtureTranscript: MeetTranscriptPayload = {
  rawText:
    'Trainer covered OOP concepts. At 34:00 students asked about interface vs abstract class. Multiple inheritance workaround at 52:00 caused confusion.',
  segments: [
    { startOffset: '00:00', text: 'Trainer covered OOP concepts.' },
    {
      startOffset: '34:00',
      text: 'Students asked about interface vs abstract class.',
    },
    {
      startOffset: '52:00',
      text: 'Multiple inheritance workaround caused confusion.',
    },
  ],
};

const createDeps = (overrides: Partial<IngestMeetTranscriptDeps> = {}): IngestMeetTranscriptDeps => {
  const stored: TranscriptDocument[] = [];
  const sentimentJobs: Array<{ sessionId: string; transcriptId: string }> = [];

  return {
    sessionExists: vi.fn(async (sessionId: string) => sessionId === 'ses-001'),
    fetchTranscript: vi.fn(async () => fixtureTranscript),
    persistTranscript: vi.fn(async (doc: Omit<TranscriptDocument, 'id'>) => {
      const saved: TranscriptDocument = { id: 'tr-ses-001', ...doc };
      stored.push(saved);
      return saved;
    }),
    enqueueAnalyzeSessionSentiment: vi.fn(async (payload) => {
      sentimentJobs.push(payload);
    }),
    ...overrides,
  };
};

describe('ingest-meet-transcript job', () => {
  it('persists transcript with summary and confusion timestamps for a valid session', async () => {
    const deps = createDeps();
    const handler = createIngestMeetTranscriptHandler(deps);

    const result = await handler({ sessionId: 'ses-001', meetConferenceId: 'conf-123' });

    expect(result.sessionId).toBe('ses-001');
    expect(result.transcriptId).toBe('tr-ses-001');
    expect(deps.persistTranscript).toHaveBeenCalledOnce();
    const persisted = vi.mocked(deps.persistTranscript).mock.calls[0][0];
    expect(persisted.sessionId).toBe('ses-001');
    expect(persisted.rawTextRef).toMatch(/^transcripts\/ses-001\//);
    expect(persisted.summary.length).toBeGreaterThan(0);
    expect(persisted.confusionTimestamps.length).toBeGreaterThan(0);
    expect(persisted.confusionTimestamps[0]?.time).toBeTruthy();
  });

  it('enqueues analyze-session-sentiment after successful ingest', async () => {
    const deps = createDeps();
    const handler = createIngestMeetTranscriptHandler(deps);

    await handler({ sessionId: 'ses-001' });

    expect(deps.enqueueAnalyzeSessionSentiment).toHaveBeenCalledWith({
      sessionId: 'ses-001',
      transcriptId: 'tr-ses-001',
    });
  });

  it('throws when the session does not exist', async () => {
    const deps = createDeps({
      sessionExists: vi.fn(async () => false),
    });
    const handler = createIngestMeetTranscriptHandler(deps);

    await expect(handler({ sessionId: 'ses-missing' })).rejects.toThrow(
      'Session not found: ses-missing',
    );
    expect(deps.fetchTranscript).not.toHaveBeenCalled();
    expect(deps.persistTranscript).not.toHaveBeenCalled();
    expect(deps.enqueueAnalyzeSessionSentiment).not.toHaveBeenCalled();
  });
});
