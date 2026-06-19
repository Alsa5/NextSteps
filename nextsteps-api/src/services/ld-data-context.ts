import { z } from 'zod';

export const traineeRowSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  personalEmail: z.string(),
  batch: z.string().nullable().optional(),
  track: z.string().optional(),
  status: z.string().optional(),
  college: z.string().optional(),
  readinessScore: z.number().optional(),
  assessmentScore: z.number().optional(),
  riskFlag: z.boolean().optional(),
  sentiment: z.string().optional(),
});

export const batchRowSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  health: z.string().optional(),
  feedbackCompletion: z.number().optional(),
  avgReadiness: z.number().optional(),
  track: z.string().optional(),
  maverickCount: z.number().optional(),
});

export const ldDataContextSchema = z.object({
  trainees: z.array(traineeRowSchema).default([]),
  batches: z.array(batchRowSchema).default([]),
  atRiskMavericks: z
    .array(
      z.object({
        name: z.string(),
        batch: z.string().optional(),
        readinessScore: z.number().optional(),
        sentiment: z.string().optional(),
        attendance: z.number().optional(),
      }),
    )
    .default([]),
});

export type LdDataContext = z.infer<typeof ldDataContextSchema>;
export type TraineeRow = z.infer<typeof traineeRowSchema>;

const normalize = (s: string) => s.trim().toLowerCase();

export const searchTrainees = (trainees: TraineeRow[], query: string, limit = 10) => {
  const q = normalize(query);
  return trainees
    .filter(
      (t) =>
        normalize(t.name).includes(q) ||
        normalize(t.personalEmail).includes(q) ||
        normalize(t.id ?? '').includes(q),
    )
    .slice(0, limit);
};

export const getQueueByTrack = (trainees: TraineeRow[]) => {
  const queue = trainees.filter((t) => !t.batch);
  return ['GET', 'PGET', 'STEP', 'LEAP'].map((track) => ({
    track,
    count: queue.filter((t) => t.track === track).length,
  }));
};
