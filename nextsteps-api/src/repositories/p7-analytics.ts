import type {
  CohortComparisonResponse,
  CurriculumCopilotResponse,
  ReminderTimingResponse,
  TopPerformersResponse,
} from '../types/p7-analytics.js';

export interface P7AnalyticsRepository {
  getCurriculumRecommendations(batchIds: string[]): Promise<CurriculumCopilotResponse | null>;
  getCohortComparison(batchA: string, batchB: string): Promise<CohortComparisonResponse | null>;
  getTopPerformers(batchId: string): Promise<TopPerformersResponse | null>;
  getReminderTiming(batchId: string): Promise<ReminderTimingResponse | null>;
  batchExists(batchId: string): Promise<boolean>;
}
