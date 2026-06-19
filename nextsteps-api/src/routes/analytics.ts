import { Router } from 'express';
import { requireRoles } from '../middleware/auth.js';
import { validateParams } from '../middleware/validate.js';
import type { SessionAnalyticsRepository } from '../repositories/session-analytics.js';
import type { AuditService } from '../services/audit.js';
import { sessionIdParamSchema } from '../schemas/session-params.js';

export interface AnalyticsRouterDeps {
  analytics: SessionAnalyticsRepository;
  audit: AuditService;
}

export const createAnalyticsRouter = (deps: AnalyticsRouterDeps): Router => {
  const router = Router();
  const { analytics, audit } = deps;

  router.get(
    '/trainer/sessions/:id/analytics',
    requireRoles('trainer'),
    validateParams(sessionIdParamSchema),
    async (req, res) => {
      const sessionId = String(req.params.id);
      const trainerId = req.authUser!.id;

      const session = await analytics.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const isAssigned =
        (await analytics.isTrainerForSession(trainerId, sessionId)) ||
        session.trainerEmail.toLowerCase() === req.authUser!.email.toLowerCase();
      if (!isAssigned) {
        res.status(403).json({ error: 'Trainer not assigned to this session' });
        return;
      }

      const transcript = await analytics.getTranscript(sessionId);

      await audit.logSensitiveRead(
        { actorId: trainerId, actorRole: req.authUser!.role, route: req.path },
        'session-analytics',
        sessionId,
      );

      res.status(200).json({
        sessionId: session.id,
        title: session.title,
        clarity: { avg: session.avgClarity },
        pace: { avg: session.avgPace },
        mood: { distribution: session.moodDistribution },
        feedbackCompletion: session.feedbackCompletion,
        attendanceRate: session.attendanceRate,
        confusionSpikes: transcript?.confusionTimestamps ?? [],
        keyTerms: transcript?.keyTerms ?? [],
        aiAnalysis: transcript?.aiAnalysis ?? null,
        privacy: 'batch-aggregate-only',
      });
    },
  );

  router.get(
    '/maverick/sessions/:id/transcript-summary',
    requireRoles('maverick'),
    validateParams(sessionIdParamSchema),
    async (req, res) => {
      const sessionId = String(req.params.id);
      const maverickId = req.authUser!.id;

      const session = await analytics.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const isEnrolled =
        (await analytics.isMaverickInSessionBatch(maverickId, sessionId)) ||
        session.audienceEmails.some((e) => e.toLowerCase() === req.authUser!.email.toLowerCase());
      if (!isEnrolled) {
        res.status(403).json({ error: 'Maverick not enrolled in session batch' });
        return;
      }

      const transcript = await analytics.getTranscript(sessionId);
      if (!transcript) {
        res.status(404).json({ error: 'Transcript summary not available' });
        return;
      }

      await audit.logSensitiveRead(
        { actorId: maverickId, actorRole: req.authUser!.role, route: req.path },
        'transcript-summary',
        sessionId,
      );

      res.status(200).json({
        sessionId,
        title: session.title,
        summary: transcript.summary,
        keyTerms: transcript.keyTerms,
        aiAnalysis: transcript.aiAnalysis ?? null,
        segments: transcript.segments ?? [],
        rawText: transcript.rawText ?? null,
      });
    },
  );

  return router;
};
