import { Router } from 'express';
import { z } from 'zod';
import { requireRoles } from '../middleware/auth.js';
import type { NotificationRepository } from '../repositories/notification-repository.js';
import type { SessionStore } from '../repositories/session-store.js';
import { createMeetLinkForUser } from '../services/meet-link-service.js';
import type { GoogleOAuthTokenRepository } from '../repositories/google-oauth-token-repository.js';
import { persistSessionToMongo } from '../services/session-mongo.js';
import { sendSessionInvites } from '../services/session-invite-mail.js';
import { runSessionTranscriptPipeline } from '../services/session-pipeline.js';
import type { NotificationRepository as NotifRepo } from '../repositories/notification-repository.js';

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
});

const createPreOnboardingSessionSchema = z.object({
  title: z.string().min(1).max(200),
  batchId: z.string().min(1).max(40),
  trainerId: z.string().min(1).max(40),
  trainerName: z.string().min(1).max(120),
  trainerEmail: z.string().email(),
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  recipients: z.array(recipientSchema).min(1),
});

export interface SessionsRouterDeps {
  sessions: SessionStore;
  notifications: NotificationRepository;
  googleTokens: GoogleOAuthTokenRepository;
}

const notifyMeetInvite = async (
  notifications: NotifRepo,
  opts: {
    email: string;
    role: 'trainer' | 'maverick';
    title: string;
    body: string;
    link: string;
    sessionId: string;
  },
) => {
  await notifications.create({
    recipientEmail: opts.email,
    role: opts.role,
    title: opts.title,
    body: opts.body,
    link: opts.link,
    meta: { type: 'meet_invite', sessionId: opts.sessionId },
  });
};

export const createSessionsRouter = (deps: SessionsRouterDeps): Router => {
  const router = Router();

  router.post(
    '/ld/pre-onboarding-sessions',
    requireRoles('ld'),
    async (req, res) => {
      const parsed = createPreOnboardingSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
        return;
      }

      const scheduledAt = new Date(parsed.data.scheduledAt).toISOString();

      let meetLink: string;
      let meetCode: string;
      let meetSource: string;

      try {
        const meet = await createMeetLinkForUser(deps.googleTokens, req.authUser!.id, {
          title: parsed.data.title,
          batchId: parsed.data.batchId,
          scheduledAt,
          trainerName: parsed.data.trainerName,
          trainerEmail: parsed.data.trainerEmail,
          recipients: parsed.data.recipients,
        });
        meetLink = meet.meetLink;
        meetCode = meet.meetCode;
        meetSource = meet.source;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create Google Meet';
        res.status(400).json({ error: message });
        return;
      }

      const session = await deps.sessions.createSession({
        title: parsed.data.title,
        batchId: parsed.data.batchId,
        trainerId: parsed.data.trainerId,
        trainerName: parsed.data.trainerName,
        trainerEmail: parsed.data.trainerEmail,
        meetLink,
        meetCode,
        scheduledAt,
        sessionType: 'pre-onboarding',
        audienceEmails: parsed.data.recipients.map((r) => r.email),
      });

      await persistSessionToMongo(session);

      const mailResult = await sendSessionInvites({
        title: parsed.data.title,
        batchId: parsed.data.batchId,
        meetLink,
        scheduledAt,
        trainerName: parsed.data.trainerName,
        trainerEmail: parsed.data.trainerEmail,
        recipients: parsed.data.recipients,
        sessionType: 'pre-onboarding',
      });

      await notifyMeetInvite(deps.notifications, {
        email: parsed.data.trainerEmail,
        role: 'trainer',
        title: `Orientation meet scheduled: ${parsed.data.title}`,
        body: `Batch ${parsed.data.batchId} — join at ${meetLink}`,
        link: '/session-analytics',
        sessionId: session.id,
      });

      for (const r of parsed.data.recipients) {
        await notifyMeetInvite(deps.notifications, {
          email: r.email,
          role: 'maverick',
          title: `You're invited: ${parsed.data.title}`,
          body: `Pre-onboarding session for batch ${parsed.data.batchId}. Meet link inside.`,
          link: '/session-transcript',
          sessionId: session.id,
        });
      }

      res.status(201).json({
        ok: true,
        session,
        meetSource,
        mail: mailResult,
        notificationsSent: parsed.data.recipients.length + 1,
      });
    },
  );

  router.get('/ld/sessions', requireRoles('ld'), async (_req, res) => {
    const sessions = await deps.sessions.listSessions();
    res.json({ sessions });
  });

  router.get('/trainer/sessions', requireRoles('trainer'), async (req, res) => {
    const trainerId = req.authUser!.id;
    const email = req.authUser!.email.toLowerCase();
    const all = await deps.sessions.listSessions();
    const sessions = all.filter(
      (s) => s.trainerId === trainerId || s.trainerEmail.toLowerCase() === email,
    );
    res.json({ sessions });
  });

  router.get('/maverick/sessions', requireRoles('maverick'), async (req, res) => {
    const email = req.authUser!.email;
    const sessions = await deps.sessions.getSessionsByAudienceEmail(email);
    res.json({ sessions });
  });

  router.post(
    '/ld/sessions/:id/complete',
    requireRoles('ld'),
    async (req, res) => {
      const sessionId = String(req.params.id);
      const session = await deps.sessions.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      try {
        const result = await runSessionTranscriptPipeline(deps.sessions, sessionId);

        await deps.notifications.create({
          recipientEmail: session.trainerEmail,
          role: 'trainer',
          title: `Transcript ready: ${session.title}`,
          body: 'AI session analysis is available in Session Analytics.',
          link: '/session-analytics',
          meta: { type: 'transcript_ready', sessionId },
        });

        for (const email of session.audienceEmails) {
          await deps.notifications.create({
            recipientEmail: email,
            role: 'maverick',
            title: `Session summary: ${session.title}`,
            body: 'Your session transcript and AI summary are ready.',
            link: '/session-transcript',
            meta: { type: 'transcript_ready', sessionId },
          });
        }

        res.status(200).json({
          ok: true,
          sessionId,
          transcript: {
            summary: result.transcript.summary,
            keyTerms: result.transcript.keyTerms,
            aiAnalysis: result.transcript.aiAnalysis,
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Pipeline failed';
        res.status(500).json({ error: message });
      }
    },
  );

  router.get('/sessions/:id', requireRoles('ld', 'trainer', 'maverick'), async (req, res) => {
    const sessionId = String(req.params.id);
    const session = await deps.sessions.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    const transcript = await deps.sessions.getTranscript(sessionId);
    res.json({ session, transcript });
  });

  return router;
};
