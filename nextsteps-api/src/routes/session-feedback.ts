import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { createAuthMiddleware } from '../middleware/auth.js';
import { createSessionFeedbackRepository } from '../repositories/session-feedback-repository.js';
import { sanitizeFeedbackForTrainer, prepareFeedbackForLD } from '../services/privacy.js';
import type { MoodType } from '../types/session-feedback.js';

const submitFeedbackSchema = z.object({
  sessionId: z.string(),
  sessionTitle: z.string().optional(),
  batchId: z.string(),
  trainerEmail: z.string().email(),
  mood: z.enum(['great', 'good', 'okay', 'confused']),
  clarity: z.number().min(1).max(5),
  pace: z.number().min(1).max(5),
  openText: z.string().optional(),
});

interface SessionFeedbackRouterDeps {
  jwtSecret: string;
}

export const createSessionFeedbackRouter = (deps: SessionFeedbackRouterDeps): Router => {
  const router = Router();
  const requireAuth = createAuthMiddleware(deps.jwtSecret);
  const feedbackRepo = createSessionFeedbackRepository();

  // Submit feedback (maverick endpoint)
  router.post('/submit', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'maverick') {
        res.status(403).json({ error: 'Access denied - mavericks only' });
        return;
      }

      const parsed = submitFeedbackSchema.parse(req.body);
      
      console.log('=== FEEDBACK SUBMISSION ===');
      console.log('Maverick:', req.authUser.email);
      console.log('Session:', parsed.sessionId);
      console.log('Mood:', parsed.mood);

      const submission = await feedbackRepo.insert({
        sessionId: parsed.sessionId,
        batchId: parsed.batchId,
        trainerEmail: parsed.trainerEmail,
        maverickId: req.authUser.id,
        maverickName: req.authUser.email.split('@')[0], // Extract name from email
        mood: parsed.mood as MoodType,
        clarity: parsed.clarity,
        pace: parsed.pace,
        openText: parsed.openText,
        submittedAt: new Date().toISOString(),
      });

      console.log('✅ Feedback saved:', submission._id);

      res.status(201).json({
        submissionId: submission._id,
        message: 'Feedback submitted successfully'
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid feedback data', details: error.errors });
        return;
      }
      console.error('Feedback submission error:', error);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  // Get sanitized feedback for trainer (aggregate only, no individual identity)
  router.get('/trainer/:sessionId', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'trainer') {
        res.status(403).json({ error: 'Access denied - trainers only' });
        return;
      }

      const { sessionId } = req.params;
      if (!sessionId || Array.isArray(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId parameter' });
        return;
      }
      
      console.log('=== TRAINER FEEDBACK REQUEST ===');
      console.log('Trainer:', req.authUser.email);
      console.log('Session:', sessionId);

      const submissions = await feedbackRepo.findBySessionId(sessionId);
      console.log('Found submissions:', submissions.length);

      // Get session info from first submission or use trainer email
      const batchId = submissions[0]?.batchId || 'unknown';
      const trainerEmail = submissions[0]?.trainerEmail || req.authUser.email;

      const sanitizedFeedback = sanitizeFeedbackForTrainer(
        submissions,
        sessionId,
        batchId,
        trainerEmail
      );

      console.log('✅ Returning sanitized feedback (trainer)');
      res.status(200).json(sanitizedFeedback);

    } catch (error) {
      console.error('Trainer feedback fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  // Get detailed feedback for L&D (with individual identity)
  router.get('/ld/:sessionId', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'ld') {
        res.status(403).json({ error: 'Access denied - L&D only' });
        return;
      }

      const { sessionId } = req.params;
      if (!sessionId || Array.isArray(sessionId)) {
        res.status(400).json({ error: 'Invalid sessionId parameter' });
        return;
      }
      
      console.log('=== L&D FEEDBACK REQUEST ===');
      console.log('L&D:', req.authUser.email);
      console.log('Session:', sessionId);

      const submissions = await feedbackRepo.findBySessionId(sessionId);
      console.log('Found submissions:', submissions.length);

      if (submissions.length === 0) {
        res.status(200).json({
          sessionId,
          batchId: 'unknown',
          trainerEmail: 'unknown',
          aggregateStats: {
            totalResponses: 0,
            moodDistribution: { great: 0, good: 0, okay: 0, confused: 0 },
            averageClarity: 0,
            averagePace: 0,
          },
          individualResponses: [],
          privacy: 'ld-full-detail',
        });
        return;
      }

      const batchId = submissions[0].batchId;
      const trainerEmail = submissions[0].trainerEmail;

      const detailedFeedback = prepareFeedbackForLD(
        submissions,
        sessionId,
        batchId,
        trainerEmail
      );

      console.log('✅ Returning detailed feedback (L&D)');
      res.status(200).json(detailedFeedback);

    } catch (error) {
      console.error('L&D feedback fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  // Get batch-wide feedback for L&D
  router.get('/ld/batch/:batchId', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'ld') {
        res.status(403).json({ error: 'Access denied - L&D only' });
        return;
      }

      const { batchId } = req.params;
      if (!batchId || Array.isArray(batchId)) {
        res.status(400).json({ error: 'Invalid batchId parameter' });
        return;
      }
      
      console.log('=== L&D BATCH FEEDBACK REQUEST ===');
      console.log('L&D:', req.authUser.email);
      console.log('Batch:', batchId);

      const submissions = await feedbackRepo.findByBatchId(batchId);
      console.log('Found batch submissions:', submissions.length);

      // Group by session
      const sessionGroups = submissions.reduce((acc, submission) => {
        if (!acc[submission.sessionId]) {
          acc[submission.sessionId] = [];
        }
        acc[submission.sessionId].push(submission);
        return acc;
      }, {} as Record<string, typeof submissions>);

      const sessionFeedbacks = Object.entries(sessionGroups).map(([sessionId, sessionSubmissions]) => {
        return prepareFeedbackForLD(
          sessionSubmissions,
          sessionId,
          batchId,
          sessionSubmissions[0].trainerEmail
        );
      });

      console.log('✅ Returning batch feedback (L&D)');
      res.status(200).json({
        batchId,
        sessions: sessionFeedbacks,
        totalSubmissions: submissions.length,
      });

    } catch (error) {
      console.error('L&D batch feedback fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch batch feedback' });
    }
  });

  return router;
};