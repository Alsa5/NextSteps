import { Router } from 'express';
import { requireRoles } from '../middleware/auth.js';
import { validateParams } from '../middleware/validate.js';
import type { P7AnalyticsRepository } from '../repositories/p7-analytics.js';
import {
  batchIdParamSchema,
  cohortComparisonQuerySchema,
  curriculumCopilotQuerySchema,
  executiveReportBodySchema,
} from '../schemas/p7-analytics-params.js';
import type { GenerateExecutiveReportPayload } from '../types/p7-analytics.js';

export interface P7AnalyticsRouterDeps {
  p7Analytics: P7AnalyticsRepository;
  enqueueGenerateExecutiveReport(
    payload: GenerateExecutiveReportPayload,
  ): Promise<{ jobId: string }>;
}

export const createP7AnalyticsRouter = (deps: P7AnalyticsRouterDeps): Router => {
  const router = Router();

  router.get(
    '/ld/curriculum-copilot/recommendations',
    requireRoles('ld'),
    async (req, res) => {
      const parsed = curriculumCopilotQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' });
        return;
      }

      const result = await deps.p7Analytics.getCurriculumRecommendations(parsed.data.batchIds);
      if (!result) {
        res.status(404).json({ error: 'No recommendations for the given batches' });
        return;
      }

      res.status(200).json({
        ...result,
        privacy: 'batch-aggregate-only',
      });
    },
  );

  router.get('/ld/reports/cohort-comparison', requireRoles('ld'), async (req, res) => {
    const parsed = cohortComparisonQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid query' });
      return;
    }

    const result = await deps.p7Analytics.getCohortComparison(
      parsed.data.batchA,
      parsed.data.batchB,
    );
    if (!result) {
      res.status(404).json({ error: 'One or both batches not found' });
      return;
    }

    res.status(200).json({
      ...result,
      privacy: 'batch-aggregate-only',
    });
  });

  router.get(
    '/ld/reports/top-performers/:batchId',
    requireRoles('ld'),
    validateParams(batchIdParamSchema),
    async (req, res) => {
      const batchId = String(req.params.batchId);
      const result = await deps.p7Analytics.getTopPerformers(batchId);
      if (!result) {
        res.status(404).json({ error: 'Batch not found' });
        return;
      }

      res.status(200).json({
        ...result,
        privacy: 'batch-aggregate-only',
      });
    },
  );

  router.post('/ld/reports/executive', requireRoles('ld'), async (req, res) => {
    const parsed = executiveReportBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid body' });
      return;
    }

    const batchExists = await deps.p7Analytics.batchExists(parsed.data.batchId);
    if (!batchExists) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    const { jobId } = await deps.enqueueGenerateExecutiveReport({
      batchId: parsed.data.batchId,
      format: parsed.data.format,
    });

    res.status(202).json({
      status: 'accepted',
      jobId,
      batchId: parsed.data.batchId,
      format: parsed.data.format,
    });
  });

  router.get(
    '/ld/batches/:batchId/reminder-timing',
    requireRoles('ld'),
    validateParams(batchIdParamSchema),
    async (req, res) => {
      const batchId = String(req.params.batchId);
      const result = await deps.p7Analytics.getReminderTiming(batchId);
      if (!result) {
        res.status(404).json({ error: 'Batch not found' });
        return;
      }

      res.status(200).json({
        ...result,
        privacy: 'batch-aggregate-only',
      });
    },
  );

  return router;
};
