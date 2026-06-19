import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createBaseTestDeps } from '../helpers/test-deps.js';

const JWT_SECRET = 'p7-analytics-test-secret';

const signToken = (payload: { sub: string; role: string }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

const createTestApp = () =>
  createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET }));

describe('GET /api/v1/ld/curriculum-copilot/recommendations (G-03)', () => {
  it('returns cross-batch curriculum recommendations for L&D', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    const response = await request(app)
      .get('/api/v1/ld/curriculum-copilot/recommendations')
      .query({ batchIds: 'B-2025-13,B-2025-14' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.batchIds).toEqual(['B-2025-13', 'B-2025-14']);
    expect(response.body.recommendations).toHaveLength(2);
    expect(response.body.recommendations[0]).toMatchObject({
      topic: expect.any(String),
      confidencePercent: expect.any(Number),
      rationale: expect.any(String),
    });
    expect(response.body.privacy).toBe('batch-aggregate-only');
  });

  it('returns 403 for trainer role', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'tr-001', role: 'trainer' });

    await request(app)
      .get('/api/v1/ld/curriculum-copilot/recommendations')
      .query({ batchIds: 'B-2025-13' })
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

describe('GET /api/v1/ld/reports/cohort-comparison (G-04)', () => {
  it('returns side-by-side cohort metrics with auto insights', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    const response = await request(app)
      .get('/api/v1/ld/reports/cohort-comparison')
      .query({ batchA: 'B-2025-13', batchB: 'B-2025-14' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.batchA.batchId).toBe('B-2025-13');
    expect(response.body.batchB.batchId).toBe('B-2025-14');
    expect(response.body.insights).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(response.body.metrics).toMatchObject({
      feedbackCompletion: expect.any(Object),
      quizAverage: expect.any(Object),
      readinessScore: expect.any(Object),
    });
  });
});

describe('GET /api/v1/ld/reports/top-performers/:batchId (G-05)', () => {
  it('returns top 10% performers with nomination flags', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    const response = await request(app)
      .get('/api/v1/ld/reports/top-performers/B-2025-13')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.batchId).toBe('B-2025-13');
    expect(response.body.topPercentile).toBe(10);
    expect(response.body.performers.length).toBeGreaterThan(0);
    expect(response.body.performers[0]).toMatchObject({
      maverickId: expect.any(String),
      compositeScore: expect.any(Number),
      rank: expect.any(Number),
      sonicNominationEligible: expect.any(Boolean),
      strideFastTrackEligible: expect.any(Boolean),
    });
  });

  it('returns 404 for unknown batch', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    await request(app)
      .get('/api/v1/ld/reports/top-performers/B-9999-99')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});

describe('POST /api/v1/ld/reports/executive (G-06)', () => {
  it('accepts executive report generation request', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    const response = await request(app)
      .post('/api/v1/ld/reports/executive')
      .set('Authorization', `Bearer ${token}`)
      .send({ batchId: 'B-2025-13', format: 'pdf' })
      .expect(202);

    expect(response.body.status).toBe('accepted');
    expect(response.body.jobId).toBe('report-test');
    expect(response.body.batchId).toBe('B-2025-13');
    expect(response.body.format).toBe('pdf');
  });

  it('returns 400 when batchId is missing', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    await request(app)
      .post('/api/v1/ld/reports/executive')
      .set('Authorization', `Bearer ${token}`)
      .send({ format: 'pdf' })
      .expect(400);
  });
});

describe('GET /api/v1/ld/batches/:batchId/reminder-timing (G-07)', () => {
  it('returns optimal reminder send windows per maverick', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    const response = await request(app)
      .get('/api/v1/ld/batches/B-2025-13/reminder-timing')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.batchId).toBe('B-2025-13');
    expect(response.body.modelVersion).toBe('stub-v1');
    expect(response.body.maverickTimings).toHaveLength(2);
    expect(response.body.maverickTimings[0]).toMatchObject({
      maverickId: expect.any(String),
      optimalHourUtc: expect.any(Number),
      engagementScore: expect.any(Number),
    });
  });
});
