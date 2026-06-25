import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { createAuthMiddleware } from '../middleware/auth.js';
import { createTrainerScoreRepository } from '../repositories/trainer-score-repository.js';
import { env } from '../config/env.js';
import type { TrainerScore } from '../types/trainer-score.js';

const awardPointsSchema = z.object({
  amount: z.number().int().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required').max(500),
});

const recognizeSchema = z.object({
  trainer_id: z.string().min(1, 'trainer_id is required'),
  awe_points: z.number().int().positive('awe_points must be positive'),
  reason: z.string().min(1, 'reason is required').max(500),
});

interface TrainerScoresRouterDeps {
  jwtSecret: string;
}

export const createTrainerScoresRouter = (deps: TrainerScoresRouterDeps): Router => {
  const router = Router();
  const requireAuth = createAuthMiddleware(deps.jwtSecret);
  const scoreRepo = createTrainerScoreRepository();

  // GET /api/v1/trainer-scores/leaderboard
  // L&D only: get all trainers ranked by score
  // MUST come before /:trainerId to avoid route collision
  router.get('/leaderboard', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'ld') {
        res.status(403).json({ error: 'Access denied - L&D only' });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const trainers = await scoreRepo.getLeaderboard(limit);

      res.status(200).json({
        count: trainers.length,
        trainers,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // POST /api/v1/trainer-scores/send-certificate
  // L&D only: send certificate to trainer
  router.post('/send-certificate', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'ld') {
        res.status(403).json({ error: 'Access denied - L&D only' });
        return;
      }

      const { trainerId, tier, scorePercentage, totalSessions } = req.body;

      if (!trainerId || !tier) {
        res.status(400).json({ error: 'trainerId and tier are required' });
        return;
      }

      const allTrainers = await scoreRepo.findAll();
      const trainer = allTrainers.find(t => t._id === trainerId) || null;

      if (!trainer) {
        res.status(404).json({ error: 'Trainer not found' });
        return;
      }

      // Store certificate in trainer document
      const certificate = {
        issuedAt: new Date().toISOString(),
        issuedBy: req.authUser.email,
        tier,
        scorePercentage,
        totalSessions,
      };

      await scoreRepo.storeCertificate(trainer.trainerEmail, certificate);

      console.log(`✅ Certificate sent to ${trainer.trainerName} by ${req.authUser.email}`);

      // Send email notifications - ONLY to the trainer (no CC to admins)
      const trainerEmail = trainer.trainerEmail;

      const tierEmoji = tier === 'platinum' ? '💎' : tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉';
      const tierColor = tier === 'platinum' ? '#e5e4e2' : tier === 'gold' ? '#f5c542' : tier === 'silver' ? '#a8b2c0' : '#cd7f32';
      const issuedDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      const emailHtml = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${tierColor};"><div style="background:linear-gradient(135deg,${tierColor}22,${tierColor}11);padding:32px;text-align:center;border-bottom:1px solid ${tierColor}33;"><div style="font-size:48px;margin-bottom:8px;">${tierEmoji}</div><h1 style="margin:0;font-size:22px;color:${tierColor};letter-spacing:1px;">Certificate of Appreciation</h1><p style="margin:8px 0 0;font-size:13px;color:rgba(0,0,0,0.6);letter-spacing:2px;text-transform:uppercase;">NextSteps L&D Platform · Hexaware Technologies</p></div><div style="padding:32px;text-align:center;"><p style="margin:0 0 8px;font-size:14px;color:rgba(0,0,0,0.6);font-style:italic;">Congratulations!</p><h2 style="margin:0 0 16px;font-size:28px;color:#333;font-weight:800;">${trainer.trainerName}</h2><p style="margin:0 0 20px;font-size:14px;color:rgba(0,0,0,0.7);line-height:1.7;max-width:400px;display:inline-block;">You have achieved the distinguished <strong style="color:${tierColor}">${tier.toUpperCase()} TIER</strong> in the NextSteps Learning & Development Platform. Your dedication and excellence in training delivery is truly appreciated.</p><p style="margin:0;font-size:13px;color:rgba(0,0,0,0.5);">Your certificate is attached to this email.</p></div><div style="padding:16px 32px 24px;text-align:center;border-top:1px solid rgba(0,0,0,0.1);"><p style="margin:0;font-size:11px;color:rgba(0,0,0,0.4);">Issued by ${req.authUser.email} · ${issuedDate}</p></div></div>`;

      // Send email if SMTP is configured
      const isSmtpConfigured = Boolean(env.SmtpHost && env.SmtpUser && env.SmtpPass && env.MailFrom);
      
      if (isSmtpConfigured) {
        try {
          const transporter = nodemailer.createTransport({
            host: env.SmtpHost,
            port: env.SmtpPort,
            secure: env.SmtpSecure,
            auth: {
              user: env.SmtpUser,
              pass: env.SmtpPass,
            },
            tls: env.SmtpTlsInsecure ? { rejectUnauthorized: false } : undefined,
          });

          // Prepare attachment if certificate image is provided
          const attachments: any[] = [];
          if (req.body.certificateImageBase64) {
            attachments.push({
              filename: `NextSteps_Certificate_${trainer.trainerName.replace(/\s+/g, '_')}.png`,
              content: Buffer.from(req.body.certificateImageBase64, 'base64'),
              contentType: 'image/png',
            });
          }

          // Send to ONLY the trainer (no CC to admins)
          await transporter.sendMail({
            from: env.MailFrom,
            to: trainerEmail,
            subject: `🎓 NextSteps Certificate — ${trainer.trainerName} | ${tier.toUpperCase()} Tier`,
            html: emailHtml,
            attachments,
          });

          console.log(`✅ Certificate email sent to ${trainerEmail}`);
        } catch (emailError) {
          console.error('Email send failed (non-blocking):', emailError);
        }
      } else {
        console.log('[trainer-cert] SMTP not configured - emails not sent');
      }

      res.status(200).json({
        message: 'Certificate sent',
        trainer: trainer.trainerName,
        certificate,
      });

    } catch (error) {
      console.error('Error sending certificate:', error);
      res.status(500).json({ error: 'Failed to send certificate' });
    }
  });

  // POST /api/v1/trainer-scores/recognize
  // L&D only: award Awe Points to a trainer via TrainerTerritories
  router.post('/recognize', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'ld') {
        res.status(403).json({ error: 'Access denied - L&D only' });
        return;
      }

      // Parse and validate input
      const parsed = recognizeSchema.parse(req.body);

      // Get trainer by ID
      const allTrainers = await scoreRepo.findAll();
      const trainer = allTrainers.find(t => t._id === parsed.trainer_id) || null;

      if (!trainer) {
        res.status(404).json({ error: 'Trainer not found' });
        return;
      }

      // Award points and store in audit history
      const updated = await scoreRepo.awardAwePoints(
        trainer.trainerEmail,
        parsed.awe_points,
        parsed.reason,
        req.authUser.email
      );

      console.log(`✅ Recognized ${trainer.trainerName} with ${parsed.awe_points} Awe Points`);
      console.log(`   Reason: ${parsed.reason}`);

      res.status(200).json({
        message: 'Trainer recognized',
        trainer: updated.trainerName,
        awePoints: updated.awePoints,
        totalAwarded: parsed.awe_points,
        reason: parsed.reason,
        recognizedBy: req.authUser.email,
        recognizedAt: new Date().toISOString(),
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid recognition request', details: error.errors });
        return;
      }
      console.error('Error recognizing trainer:', error);
      res.status(500).json({ error: 'Failed to recognize trainer' });
    }
  });

  // GET /api/v1/trainer-scores/:trainerId/certificates
  // Trainer can view own certificates, L&D can view any
  // MUST come before GET /:trainerId to avoid route collision
  router.get('/:trainerId/certificates', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      let trainerId = req.params.trainerId;
      if (Array.isArray(trainerId)) {
        trainerId = trainerId[0];
      }

      const allTrainers = await scoreRepo.findAll();
      const trainer = allTrainers.find(t => t._id === trainerId || t.trainerEmail === req.authUser!.email) || null;

      if (!trainer) {
        res.status(404).json({ error: 'Trainer not found' });
        return;
      }

      const isOwn = req.authUser.email === trainer.trainerEmail;
      const isLd = req.authUser.role === 'ld';

      if (!isOwn && !isLd) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.status(200).json({ certificates: (trainer as any).certificates || [] });

    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({ error: 'Failed to fetch certificates' });
    }
  });

  // GET /api/v1/trainer-scores/:trainerId
  // Returns the trainer's own score or L&D can view any trainer's score
  router.get('/:trainerId', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      let trainerId = req.params.trainerId;
      if (Array.isArray(trainerId)) {
        trainerId = trainerId[0];
      }

      const isOwnScore = req.authUser.id === trainerId || req.authUser.email === trainerId;
      const isLd = req.authUser.role === 'ld';

      if (!isOwnScore && !isLd) {
        res.status(403).json({ error: 'Access denied - can only view own score or L&D role' });
        return;
      }

      // Support both email and ID lookups
      const score = trainerId.includes('@')
        ? await scoreRepo.getByEmail(trainerId)
        : await scoreRepo.getByEmail(trainerId); // Try as email first

      if (!score) {
        res.status(404).json({ error: 'Trainer not found' });
        return;
      }

      console.log(`✅ Score retrieved for trainer: ${score.trainerEmail}`);

      res.status(200).json(score);

    } catch (error) {
      console.error('Error fetching trainer score:', error);
      res.status(500).json({ error: 'Failed to fetch trainer score' });
    }
  });

  // POST /api/v1/trainer-scores/:trainerId/award-points
  // L&D only: award Awe Points to a trainer
  router.post('/:trainerId/award-points', requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.authUser || req.authUser.role !== 'ld') {
        res.status(403).json({ error: 'Access denied - L&D only' });
        return;
      }

      let trainerId = req.params.trainerId;
      if (Array.isArray(trainerId)) {
        trainerId = trainerId[0];
      }

      // Parse and validate input
      const parsed = awardPointsSchema.parse(req.body);

      // Get trainer by email or ID
      let trainer: TrainerScore | null = null;
      if (trainerId.includes('@')) {
        trainer = await scoreRepo.getByEmail(trainerId);
      } else {
        // Try to find by ID or email
        const allTrainers = await scoreRepo.findAll();
        trainer = allTrainers.find(t => t._id === trainerId || t.trainerEmail === trainerId) || null;
      }

      if (!trainer) {
        res.status(404).json({ error: 'Trainer not found' });
        return;
      }

      // Award points and store in audit history
      const updated = await scoreRepo.awardAwePoints(
        trainer.trainerEmail,
        parsed.amount,
        parsed.reason,
        req.authUser.email
      );

      console.log(`✅ Awarded ${parsed.amount} Awe Points to ${trainer.trainerEmail} by ${req.authUser.email}`);
      console.log(`   Reason: ${parsed.reason}`);

      res.status(200).json({
        message: 'Awe Points awarded',
        trainer: updated.trainerName,
        awePoints: updated.awePoints,
        totalAwarded: parsed.amount,
        reason: parsed.reason,
        awardedBy: req.authUser.email,
        awardedAt: new Date().toISOString(),
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid award request', details: error.errors });
        return;
      }
      console.error('Error awarding points:', error);
      res.status(500).json({ error: 'Failed to award points' });
    }
  });

  return router;
};
