import type { ReminderTimingResponse } from '../../types/p7-analytics.js';

export interface ComputeReminderTimingPayload {
  batchId: string;
}

export interface ComputeReminderTimingResult {
  batchId: string;
  modelVersion: string;
  maverickTimings: ReminderTimingResponse['maverickTimings'];
  computedAt: string;
}

export interface ComputeReminderTimingDeps {
  getEngagementHistory(batchId: string): Promise<Array<{ maverickId: string; openRate: number; hourUtc: number }>>;
}

export const computeOptimalHour = (openRate: number, hourUtc: number): number => {
  if (openRate >= 0.8) {
    return hourUtc;
  }

  return (hourUtc + 2) % 24;
};

export const createComputeReminderTimingHandler =
  (deps: ComputeReminderTimingDeps) =>
  async (payload: ComputeReminderTimingPayload): Promise<ComputeReminderTimingResult> => {
    const history = await deps.getEngagementHistory(payload.batchId);

    const maverickTimings = history.map((entry) => ({
      maverickId: entry.maverickId,
      optimalHourUtc: computeOptimalHour(entry.openRate, entry.hourUtc),
      engagementScore: entry.openRate,
      preferredChannel: entry.openRate >= 0.75 ? ('email' as const) : ('sms' as const),
    }));

    return {
      batchId: payload.batchId,
      modelVersion: 'stub-v1',
      maverickTimings,
      computedAt: new Date().toISOString(),
    };
  };

export const createStubComputeReminderTimingDeps = (): ComputeReminderTimingDeps => ({
  getEngagementHistory: async () => [
    { maverickId: 'mav-004', openRate: 0.82, hourUtc: 14 },
    { maverickId: 'mav-005', openRate: 0.71, hourUtc: 16 },
  ],
});
