import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createBaseTestDeps } from '../helpers/test-deps.js';

const JWT_SECRET = 'transcript-analytics-test-secret';

const signToken = (payload: { sub: string; role: string }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const createTestApp = () =>
  createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET }));

describe('GET /api/v1/trainer/sessions/:id/analytics', () => {
  it('returns batch-level aggregates without individual Maverick identifiers', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'tr-001', role: 'trainer' });

    const response = await request(app)
      .get('/api/v1/trainer/sessions/ses-001/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.sessionId).toBe('ses-001');
    expect(response.body.clarity.avg).toBe(4.1);
    expect(response.body.pace.avg).toBe(3.8);
    expect(response.body.mood.distribution).toEqual({
      great: 3,
      good: 1,
      okay: 1,
      confused: 0,
    });
    expect(response.body.confusionSpikes).toHaveLength(2);
    expect(response.body.privacy).toBe('batch-aggregate-only');
    expect(JSON.stringify(response.body)).not.toMatch(/mav-/);
    expect(JSON.stringify(response.body)).not.toMatch(/Priya|Arjun|Sneha/);
  });

  it('returns 403 when the trainer is not assigned to the session', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'tr-002', role: 'trainer' });

    await request(app)
      .get('/api/v1/trainer/sessions/ses-001/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('returns 403 for non-trainer roles', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'mav-001', role: 'maverick' });

    await request(app)
      .get('/api/v1/trainer/sessions/ses-001/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('returns 404 when the session does not exist', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'tr-001', role: 'trainer' });

    await request(app)
      .get('/api/v1/trainer/sessions/ses-missing/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('GET /api/v1/maverick/sessions/:id/transcript-summary', () => {
  it('returns transcript summary for a Maverick enrolled in the session batch', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'mav-001', role: 'maverick' });

    const response = await request(app)
      .get('/api/v1/maverick/sessions/ses-001/transcript-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.sessionId).toBe('ses-001');
    expect(response.body.summary).toHaveLength(5);
    expect(response.body.keyTerms).toContain('Inheritance');
    expect(response.body.confusionSpikes).toBeUndefined();
  });

  it('returns 403 when the Maverick is not in the session batch', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'mav-006', role: 'maverick' });

    await request(app)
      .get('/api/v1/maverick/sessions/ses-001/transcript-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('returns 401 without authorization', async () => {
    const app = createTestApp();

    await request(app)
      .get('/api/v1/maverick/sessions/ses-001/transcript-summary')
      .expect(401);
  });

  it('returns 400 for invalid session id format', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'mav-001', role: 'maverick' });

    await request(app)
      .get('/api/v1/maverick/sessions/not-valid/transcript-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
