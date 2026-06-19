import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createBaseTestDeps } from '../helpers/test-deps.js';

const JWT_SECRET = 'feedback-completion-test-secret';

const signToken = (payload: { sub: string; role: string }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const createTestApp = () =>
  createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET }));

describe('GET /api/v1/ld/batches/:batchId/feedback-dashboard', () => {
  it('returns live batch completion metrics for L&D', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    const response = await request(app)
      .get('/api/v1/ld/batches/B-2025-13/feedback-dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.batchId).toBe('B-2025-13');
    expect(response.body.completionPercent).toBe(70);
    expect(response.body.submittedCount).toBe(7);
    expect(response.body.totalSlots).toBe(10);
    expect(response.body.xpBonusThresholdPercent).toBe(90);
    expect(response.body.xpBonusEligible).toBe(false);
    expect(response.body.sessions).toHaveLength(2);
    expect(response.body.reminderTiers).toEqual({ day0: true, day1: false, day2: false });
    expect(response.body.privacy).toBe('batch-aggregate-only');
    expect(response.body.kAnonymityApplied).toBe(true);
    expect(JSON.stringify(response.body)).not.toMatch(/pendingMaverickIds/);
  });

  it('returns 403 for trainer role on L&D route', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'tr-001', role: 'trainer' });

    await request(app)
      .get('/api/v1/ld/batches/B-2025-13/feedback-dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

describe('GET /api/v1/trainer/batches/:batchId/feedback-dashboard', () => {
  it('returns dashboard for assigned trainer', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'tr-001', role: 'trainer' });

    const response = await request(app)
      .get('/api/v1/trainer/batches/B-2025-13/feedback-dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.batchId).toBe('B-2025-13');
    expect(response.body.submissionsAwayFromXpBonus).toBe(2);
  });

  it('returns 403 when trainer is not assigned to batch', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'tr-002', role: 'trainer' });

    await request(app)
      .get('/api/v1/trainer/batches/B-2025-13/feedback-dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

describe('POST /api/v1/webhooks/pulse/feedback-submitted', () => {
  it('accepts pulse feedback events and enqueues XP bonus evaluation', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/v1/webhooks/pulse/feedback-submitted')
      .send({ sessionId: 'ses-001', maverickId: 'mav-004', batchId: 'B-2025-13' })
      .expect(202);

    expect(response.body.status).toBe('accepted');
    expect(response.body.jobId).toBeTruthy();
  });
});
