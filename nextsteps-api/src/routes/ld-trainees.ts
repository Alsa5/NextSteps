import { Router } from 'express';
import { z } from 'zod';
import { requireRoles } from '../middleware/auth.js';
import type { TraineeRegistryRepository } from '../repositories/trainee-registry-repository.js';
import { sendOnboardingMail } from '../services/onboarding-mail.js';
import { syncTraineeRegistryPayload } from '../services/trainee-registry-sync.js';

const attachmentSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  dataBase64: z.string().min(1),
}).optional();

const onboardingMailSchema = z.object({
  traineeName: z.string().min(1).max(120),
  personalEmail: z.string().email(),
  batch: z.string().min(1).max(40),
  track: z.string().min(1).max(40),
  role: z.string().min(1).max(120),
  location: z.string().min(1).max(300),
  onboardingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reportingTime: z.string().min(1).max(40),
  attachment: attachmentSchema,
});

export interface LdTraineesRouterDeps {
  traineeRegistry: TraineeRegistryRepository;
}

export const createLdTraineesRouter = (deps: LdTraineesRouterDeps): Router => {
  const router = Router();

  router.get('/ld/trainees', (_req, res) => {
    res.json({ trainees: [] });
  });

  router.post(
    '/ld/trainee-registry/sync',
    requireRoles('ld'),
    async (req, res) => {
      const result = await syncTraineeRegistryPayload(deps.traineeRegistry, req.body);
      if ('error' in result) {
        res.status(400).json(result);
        return;
      }
      res.status(200).json(result);
    },
  );

  router.post(
    '/ld/onboarding-mail',
    requireRoles('ld'),
    async (req, res) => {
      const parsed = onboardingMailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid onboarding mail payload', details: parsed.error.flatten() });
        return;
      }

      try {
        const result = await sendOnboardingMail(parsed.data);

        await deps.traineeRegistry.upsert({
          email: parsed.data.personalEmail,
          fullName: parsed.data.traineeName,
          batch: parsed.data.batch,
          status: 'post-onboarding',
        });

        res.status(200).json({
          ok: true,
          delivered: result.delivered,
          channel: result.channel,
          employeeId: result.employeeId,
          hexEmail: result.hexEmail,
          subject: result.subject,
          ...(result.error ? { smtpWarning: result.error } : {}),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send onboarding mail';
        res.status(400).json({ error: message });
      }
    },
  );

  return router;
};
