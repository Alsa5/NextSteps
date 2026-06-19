import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp, type AppDeps } from '../../src/app.js';
import { createBaseTestDeps } from '../helpers/test-deps.js';

const createDeps = (): AppDeps => ({
  ...createBaseTestDeps(),
  enqueueIngestMeetTranscript: vi.fn(async () => ({ jobId: 'job-123' })),
  enqueueSendFeedbackReminder: vi.fn(async () => ({ jobId: 'reminder-123' })),
  enqueueEvaluateBatchXpBonus: vi.fn(async () => ({ jobId: 'xp-123' })),
  enqueueGenerateExecutiveReport: vi.fn(async () => ({ jobId: 'report-123' })),
  jwtSecret: 'meet-webhook-test-secret',
});

describe('POST /api/v1/webhooks/meet/session-ended', () => {
  it('accepts a valid payload and enqueues ingest-meet-transcript', async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const response = await request(app)
      .post('/api/v1/webhooks/meet/session-ended')
      .send({ sessionId: 'ses-001', meetConferenceId: 'conf-abc' })
      .expect(202);

    expect(response.body).toEqual({
      status: 'accepted',
      jobId: 'job-123',
      sessionId: 'ses-001',
    });
    expect(deps.enqueueIngestMeetTranscript).toHaveBeenCalledWith({
      sessionId: 'ses-001',
      meetConferenceId: 'conf-abc',
    });
  });

  it('returns 400 when sessionId is missing', async () => {
    const deps = createDeps();
    const app = createApp(deps);

    const response = await request(app)
      .post('/api/v1/webhooks/meet/session-ended')
      .send({ meetConferenceId: 'conf-abc' })
      .expect(400);

    expect(response.body.error).toBe('sessionId is required');
    expect(deps.enqueueIngestMeetTranscript).not.toHaveBeenCalled();
  });
});
