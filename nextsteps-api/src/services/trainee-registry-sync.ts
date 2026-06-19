import { z } from 'zod';
import type { TraineeRegistryRepository } from '../repositories/trainee-registry-repository.js';

export const registrySyncSchema = z.object({
  trainees: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      personalEmail: z.string().email(),
      batch: z.string().nullable().optional(),
      status: z.string().optional(),
    }),
  ),
});

export type RegistrySyncInput = z.infer<typeof registrySyncSchema>;

export const syncTraineeRegistryPayload = async (
  registry: TraineeRegistryRepository,
  body: unknown,
): Promise<{ synced: number } | { error: string; details?: unknown }> => {
  const parsed = registrySyncSchema.safeParse(body);
  if (!parsed.success) {
    return { error: 'Invalid trainee sync payload', details: parsed.error.flatten() };
  }

  const count = await registry.upsertMany(
    parsed.data.trainees.map((t) => ({
      email: t.personalEmail,
      fullName: t.name,
      batch: t.batch ?? null,
      status: t.status ?? (t.batch ? 'pre-onboarding' : 'recruited'),
      externalId: t.id,
    })),
  );

  return { synced: count };
};
