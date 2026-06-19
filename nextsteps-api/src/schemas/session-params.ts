import { z } from 'zod';

export const sessionIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^ses-[a-z0-9-]+$/i, 'session id must match ses-* format'),
});

export type SessionIdParams = z.infer<typeof sessionIdParamSchema>;
