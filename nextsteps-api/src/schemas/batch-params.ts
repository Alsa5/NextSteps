import { z } from 'zod';

export const batchIdParamSchema = z.object({
  batchId: z
    .string()
    .trim()
    .regex(/^B-\d{4}-\d{2,}$/, 'batchId must match pattern B-YYYY-NN'),
});
