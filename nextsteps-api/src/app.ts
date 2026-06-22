import cors from 'cors';
import express, { type Express } from 'express';
import { createAuthMiddleware } from './middleware/auth.js';
import {
  JOB_INGEST_MEET_TRANSCRIPT,
  type EvaluateBatchXpBonusPayload,
  type GenerateExecutiveReportPayload,
  type IngestMeetTranscriptPayload,
  type SendFeedbackReminderPayload,
} from './models/queue-names.js';
import { createAiRouter } from './routes/ai.js';
import { createAnalyticsRouter } from './routes/analytics.js';
import { createAuthRouter } from './routes/auth.js';
import { createFeedbackCompletionRouter } from './routes/feedback-completion.js';
import { createP7AnalyticsRouter } from './routes/p7-analytics.js';
import { createLdTraineesRouter } from './routes/ld-trainees.js';
import { createLdAiHelperRouter } from './routes/ld-ai-helper.js';
import { createNotificationsRouter } from './routes/notifications.js';
import { createSessionsRouter } from './routes/sessions.js';
import { createRoleAdminRouter } from './routes/roles.js';
import { createGoogleOAuthCallbackRouter, createGoogleOAuthRouter } from './routes/google-oauth.js';
import type { GoogleOAuthTokenRepository } from './repositories/google-oauth-token-repository.js';
import type { NotificationRepository } from './repositories/notification-repository.js';
import type { SessionStore } from './repositories/session-store.js';
import type { FeedbackCompletionRepository } from './repositories/feedback-completion.js';
import type { AuditLogRepository } from './repositories/audit-log.js';
import type { P7AnalyticsRepository } from './repositories/p7-analytics.js';
import type { RoleMappingRepository } from './repositories/role-mapping-repository.js';
import type { TraineeRegistryRepository } from './repositories/trainee-registry-repository.js';
import type { SessionAnalyticsRepository } from './repositories/session-analytics.js';
import type { UserRepository } from './repositories/user-repository.js';
import { createAuditService } from './services/audit.js';
import { DEFAULT_K_ANONYMITY_THRESHOLD } from './services/privacy.js';
import { syncTraineeRegistryPayload } from './services/trainee-registry-sync.js';
import { env } from './config/env.js';
import { registerSpaStatic } from './middleware/spa-static.js';

export interface MeetWebhookDeps {
  enqueueIngestMeetTranscript(
    payload: IngestMeetTranscriptPayload,
  ): Promise<{ jobId: string }>;
}

export interface FeedbackJobDeps {
  enqueueSendFeedbackReminder(
    payload: SendFeedbackReminderPayload,
  ): Promise<{ jobId: string }>;
  enqueueEvaluateBatchXpBonus(
    payload: EvaluateBatchXpBonusPayload,
  ): Promise<{ jobId: string }>;
  enqueueGenerateExecutiveReport(
    payload: GenerateExecutiveReportPayload,
  ): Promise<{ jobId: string }>;
}

export interface AppDeps extends MeetWebhookDeps, FeedbackJobDeps {
  analytics: SessionAnalyticsRepository;
  sessions: SessionStore;
  notifications: NotificationRepository;
  feedbackCompletion: FeedbackCompletionRepository;
  p7Analytics: P7AnalyticsRepository;
  auditLog: AuditLogRepository;
  users: UserRepository;
  roleMappings: RoleMappingRepository;
  traineeRegistry: TraineeRegistryRepository;
  googleTokens: GoogleOAuthTokenRepository;
  jwtSecret: string;
  corsOrigin: string;
  kAnonymityThreshold?: number;
}

export const createApp = (deps: AppDeps): Express => {
  const app = express();
  const requireAuth = createAuthMiddleware(deps.jwtSecret);

  app.use(
    cors({
      origin: deps.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'nextsteps-api' });
  });

  app.use(
    '/api/v1/auth',
    createAuthRouter({
      jwtSecret: deps.jwtSecret,
      users: deps.users,
      roleMappings: deps.roleMappings,
      traineeRegistry: deps.traineeRegistry,
    }),
  );

  // AI proxy — no auth required (JWT would be needed for production)
  app.use('/api/v1/ai', createAiRouter());

  app.post('/api/v1/webhooks/meet/session-ended', async (req, res) => {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
    const meetConferenceId =
      typeof req.body?.meetConferenceId === 'string'
        ? req.body.meetConferenceId.trim()
        : undefined;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const payload: IngestMeetTranscriptPayload = { sessionId };
    if (meetConferenceId) {
      payload.meetConferenceId = meetConferenceId;
    }

    const { jobId } = await deps.enqueueIngestMeetTranscript(payload);

    res.status(202).json({
      status: 'accepted',
      jobId,
      sessionId,
    });
  });

  app.post('/api/v1/webhooks/pulse/feedback-submitted', async (req, res) => {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
    const maverickId = typeof req.body?.maverickId === 'string' ? req.body.maverickId.trim() : '';
    const batchId = typeof req.body?.batchId === 'string' ? req.body.batchId.trim() : '';

    if (!sessionId || !maverickId || !batchId) {
      res.status(400).json({ error: 'sessionId, maverickId, and batchId are required' });
      return;
    }

    await deps.feedbackCompletion.recordFeedbackSubmission({
      sessionId,
      maverickId,
      submittedAt: new Date().toISOString(),
    });

    const { jobId } = await deps.enqueueEvaluateBatchXpBonus({ batchId, sessionId });

    res.status(202).json({
      status: 'accepted',
      jobId,
      sessionId,
      batchId,
    });
  });

  // Dev/local: sync browser roster → MongoDB without L&D JWT (Vite + localStorage workflow)
  if (env.NodeEnv !== 'production') {
    app.post('/api/v1/trainee-registry/sync', async (req, res) => {
      const result = await syncTraineeRegistryPayload(deps.traineeRegistry, req.body);
      if ('error' in result) {
        res.status(400).json(result);
        return;
      }
      res.status(200).json(result);
    });
  }

  // Google OAuth callback — no JWT (redirect from Google)
  app.use(
    '/api/v1',
    createGoogleOAuthCallbackRouter({
      googleTokens: deps.googleTokens,
      jwtSecret: deps.jwtSecret,
      corsOrigin: deps.corsOrigin,
    }),
  );

  app.use(requireAuth);

  app.use('/api/v1', createLdTraineesRouter({ traineeRegistry: deps.traineeRegistry }));
  app.use(
    '/api/v1',
    createLdAiHelperRouter({ traineeRegistry: deps.traineeRegistry }),
  );

  app.use(
    '/api/v1',
    createGoogleOAuthRouter({
      googleTokens: deps.googleTokens,
      jwtSecret: deps.jwtSecret,
      corsOrigin: deps.corsOrigin,
    }),
  );

  app.use(
    '/api/v1',
    createSessionsRouter({
      sessions: deps.sessions,
      notifications: deps.notifications,
      googleTokens: deps.googleTokens,
    }),
  );

  app.use('/api/v1', createNotificationsRouter({ notifications: deps.notifications }));

  app.use(
    '/api/v1/admin/roles',
    createRoleAdminRouter({
      users: deps.users,
      roleMappings: deps.roleMappings,
    }),
  );

  const audit = createAuditService(deps.auditLog);

  app.use(
    '/api/v1',
    createAnalyticsRouter({
      analytics: deps.analytics,
      audit,
    }),
  );
  app.use(
    '/api/v1',
    createFeedbackCompletionRouter({
      feedbackCompletion: deps.feedbackCompletion,
      audit,
      kAnonymityThreshold: deps.kAnonymityThreshold ?? DEFAULT_K_ANONYMITY_THRESHOLD,
    }),
  );
  app.use(
    '/api/v1',
    createP7AnalyticsRouter({
      p7Analytics: deps.p7Analytics,
      enqueueGenerateExecutiveReport: deps.enqueueGenerateExecutiveReport,
    }),
  );

  registerSpaStatic(app);

  return app;
};

export { JOB_INGEST_MEET_TRANSCRIPT };
