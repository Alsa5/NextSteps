import { z } from 'zod';
import { batchIdParamSchema } from './batch-params.js';

export const curriculumCopilotQuerySchema = z.object({
  batchIds: z
    .string()
    .trim()
    .min(1, 'batchIds is required')
    .transform((value) =>
      value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .refine((ids) => ids.length > 0, 'At least one batchId is required')
    .refine(
      (ids) => ids.every((id) => /^B-\d{4}-\d{2,}$/.test(id)),
      'Each batchId must match pattern B-YYYY-NN',
    ),
});

export const cohortComparisonQuerySchema = z.object({
  batchA: batchIdParamSchema.shape.batchId,
  batchB: batchIdParamSchema.shape.batchId,
});

export const executiveReportBodySchema = z.object({
  batchId: batchIdParamSchema.shape.batchId,
  format: z.enum(['pdf', 'excel']).default('pdf'),
});

export { batchIdParamSchema };
