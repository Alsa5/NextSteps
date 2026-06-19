import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { createInMemoryAuditLogRepository } from '../../src/repositories/in-memory-audit-log.js';
import {
  containsNamedIdentifiers,
  DEFAULT_K_ANONYMITY_THRESHOLD,
  meetsKAnonymity,
  sanitizeBatchFeedbackDashboard,
} from '../../src/services/privacy.js';
import type { BatchFeedbackDashboard } from '../../src/types/feedback-completion.js';
import { createBaseTestDeps } from '../helpers/test-deps.js';

const JWT_SECRET = 'privacy-rbac-test-secret';

const signToken = (payload: { sub: string; role: string }) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

describe('privacy service (G-08)', () => {
  it('meets k-anonymity when cohort size >= threshold', () => {
    expect(meetsKAnonymity(5, DEFAULT_K_ANONYMITY_THRESHOLD)).toBe(true);
    expect(meetsKAnonymity(4, DEFAULT_K_ANONYMITY_THRESHOLD)).toBe(false);
  });

  it('strips pendingMaverickIds from sanitized dashboard', () => {
    const dashboard: BatchFeedbackDashboard = {
      batchId: 'B-test',
      completionPercent: 60,
      submittedCount: 3,
      totalSlots: 5,
      xpBonusThresholdPercent: 90,
      xpBonusEligible: false,
      xpBonusAwarded: false,
      submissionsAwayFromXpBonus: 2,
      sessions: [
        {
          sessionId: 'ses-001',
          submittedCount: 2,
          pendingCount: 3,
          completionPercent: 40,
          pendingMaverickIds: ['mav-001', 'mav-002', 'mav-003'],
        },
      ],
      reminderTiers: { day0: true, day1: false, day2: false },
    };

    const sanitized = sanitizeBatchFeedbackDashboard(dashboard, 5);
    expect(sanitized.sessions[0]).not.toHaveProperty('pendingMaverickIds');
    expect(sanitized.kAnonymityApplied).toBe(true);
    expect(containsNamedIdentifiers(sanitized)).toBe(false);
  });

  it('suppresses session breakdowns when cohort below k-anonymity threshold', () => {
    const dashboard: BatchFeedbackDashboard = {
      batchId: 'B-small',
      completionPercent: 50,
      submittedCount: 2,
      totalSlots: 4,
      xpBonusThresholdPercent: 90,
      xpBonusEligible: false,
      xpBonusAwarded: false,
      submissionsAwayFromXpBonus: 2,
      sessions: [
        {
          sessionId: 'ses-001',
          submittedCount: 1,
          pendingCount: 3,
          completionPercent: 25,
          pendingMaverickIds: ['mav-001'],
        },
      ],
      reminderTiers: { day0: false, day1: false, day2: false },
    };

    const sanitized = sanitizeBatchFeedbackDashboard(dashboard, 4);
    expect(sanitized.sessions).toEqual([]);
    expect(sanitized.kAnonymityApplied).toBe(false);
    expect(sanitized.completionPercent).toBe(50);
  });
});

describe('G-08 RBAC + audit on ALSAA-59 feedback routes', () => {
  it('returns aggregate-only dashboard without named Maverick identifiers', async () => {
    const app = createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET }));
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    const response = await request(app)
      .get('/api/v1/ld/batches/B-2025-13/feedback-dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.privacy).toBe('batch-aggregate-only');
    expect(response.body.kAnonymityApplied).toBe(true);
    expect(response.body).not.toHaveProperty('pendingMaverickIds');
    expect(JSON.stringify(response.body)).not.toMatch(/pendingMaverickIds/);
    expect(JSON.stringify(response.body)).not.toMatch(/mav-/);
  });

  it('logs audit entry on sensitive feedback dashboard read', async () => {
    const auditLog = createInMemoryAuditLogRepository();
    const app = createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET, auditLog }));
    const token = signToken({ sub: 'ld-001', role: 'ld' });

    await request(app)
      .get('/api/v1/ld/batches/B-2025-13/feedback-dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const entries = await auditLog.findByResource('feedback-dashboard', 'B-2025-13');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.actorId).toBe('ld-001');
    expect(entries[0]?.actorRole).toBe('ld');
    expect(entries[0]?.action).toBe('read');
  });

  it('returns 403 for maverick role on L&D feedback dashboard', async () => {
    const app = createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET }));
    const token = signToken({ sub: 'mav-001', role: 'maverick' });

    await request(app)
      .get('/api/v1/ld/batches/B-2025-13/feedback-dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('returns 403 for manager role on trainer analytics route', async () => {
    const app = createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET }));
    const token = signToken({ sub: 'mgr-001', role: 'manager' });

    await request(app)
      .get('/api/v1/trainer/sessions/ses-001/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

describe('G-08 RBAC + audit on ALSAA-58/59 analytics routes', () => {
  it('logs audit entry on transcript summary read', async () => {
    const auditLog = createInMemoryAuditLogRepository();
    const app = createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET, auditLog }));
    const token = signToken({ sub: 'mav-001', role: 'maverick' });

    await request(app)
      .get('/api/v1/maverick/sessions/ses-001/transcript-summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const entries = await auditLog.findByResource('transcript-summary', 'ses-001');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.actorId).toBe('mav-001');
  });

  it('logs audit entry on trainer session analytics read', async () => {
    const auditLog = createInMemoryAuditLogRepository();
    const app = createApp(createBaseTestDeps({ jwtSecret: JWT_SECRET, auditLog }));
    const token = signToken({ sub: 'tr-001', role: 'trainer' });

    await request(app)
      .get('/api/v1/trainer/sessions/ses-001/analytics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const entries = await auditLog.findByResource('session-analytics', 'ses-001');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.actorRole).toBe('trainer');
  });
});
