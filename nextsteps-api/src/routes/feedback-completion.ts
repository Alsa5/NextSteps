import { Router } from 'express';
import { requireRoles } from '../middleware/auth.js';
import { validateParams } from '../middleware/validate.js';
import type { FeedbackCompletionRepository } from '../repositories/feedback-completion.js';
import type { AuditService } from '../services/audit.js';
import { sanitizeBatchFeedbackDashboard } from '../services/privacy.js';
import { batchIdParamSchema } from '../schemas/batch-params.js';

export interface FeedbackCompletionRouterDeps {
  feedbackCompletion: FeedbackCompletionRepository;
  audit: AuditService;
  kAnonymityThreshold?: number;
}

export const createFeedbackCompletionRouter = (
  deps: FeedbackCompletionRouterDeps,
): Router => {
  const router = Router();
  const { feedbackCompletion, audit, kAnonymityThreshold } = deps;

  const handleDashboard = async (
    batchId: string,
    actorId: string,
    actorRole: string,
    route: string,
    res: import('express').Response,
  ): Promise<boolean> => {
    const dashboard = await feedbackCompletion.getBatchDashboard(batchId);
    if (!dashboard) {
      res.status(404).json({ error: 'Batch not found' });
      return false;
    }

    const cohortSize = await feedbackCompletion.getBatchCohortSize(batchId);

    await audit.logSensitiveRead(
      { actorId, actorRole, route },
      'feedback-dashboard',
      batchId,
    );

    res.status(200).json(
      sanitizeBatchFeedbackDashboard(dashboard, cohortSize, kAnonymityThreshold),
    );
    return true;
  };

  router.get(
    '/ld/batches/:batchId/feedback-dashboard',
    requireRoles('ld'),
    validateParams(batchIdParamSchema),
    async (req, res) => {
      const batchId = String(req.params.batchId);
      await handleDashboard(
        batchId,
        req.authUser!.id,
        req.authUser!.role,
        req.path,
        res,
      );
    },
  );

  router.get(
    '/trainer/batches/:batchId/feedback-dashboard',
    requireRoles('trainer'),
    validateParams(batchIdParamSchema),
    async (req, res) => {
      const batchId = String(req.params.batchId);
      const trainerId = req.authUser!.id;

      const isAssigned = await feedbackCompletion.isTrainerForBatch(trainerId, batchId);
      if (!isAssigned) {
        res.status(403).json({ error: 'Trainer not assigned to this batch' });
        return;
      }

      await handleDashboard(
        batchId,
        trainerId,
        req.authUser!.role,
        req.path,
        res,
      );
    },
  );

  return router;
};
