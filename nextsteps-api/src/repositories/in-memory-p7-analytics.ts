import type { P7AnalyticsRepository } from './p7-analytics.js';
import type {
  CohortComparisonResponse,
  CohortMetrics,
  CurriculumCopilotResponse,
  ReminderTimingResponse,
  TopPerformersResponse,
} from '../types/p7-analytics.js';

const KNOWN_BATCHES = new Set(['B-2025-13', 'B-2025-14']);

const BATCH_METRICS: Record<string, CohortMetrics> = {
  'B-2025-13': {
    feedbackCompletionPercent: 70,
    quizAverage: 78,
    readinessScore: 72,
    streamDistribution: { 'full-stack': 3, data: 2 },
  },
  'B-2025-14': {
    feedbackCompletionPercent: 85,
    quizAverage: 82,
    readinessScore: 79,
    streamDistribution: { 'full-stack': 2, cloud: 3 },
  },
};

const buildMetricDelta = (batchA: CohortMetrics, batchB: CohortMetrics) => ({
  feedbackCompletion: {
    batchA: batchA.feedbackCompletionPercent,
    batchB: batchB.feedbackCompletionPercent,
    delta: batchB.feedbackCompletionPercent - batchA.feedbackCompletionPercent,
  },
  quizAverage: {
    batchA: batchA.quizAverage,
    batchB: batchB.quizAverage,
    delta: batchB.quizAverage - batchA.quizAverage,
  },
  readinessScore: {
    batchA: batchA.readinessScore,
    batchB: batchB.readinessScore,
    delta: batchB.readinessScore - batchA.readinessScore,
  },
});

export const createInMemoryP7AnalyticsRepository = (): P7AnalyticsRepository => ({
  async batchExists(batchId: string): Promise<boolean> {
    return KNOWN_BATCHES.has(batchId);
  },

  async getCurriculumRecommendations(batchIds: string[]): Promise<CurriculumCopilotResponse | null> {
    const validIds = batchIds.filter((id) => KNOWN_BATCHES.has(id));
    if (validIds.length === 0) {
      return null;
    }

    return {
      batchIds: validIds,
      generatedAt: new Date().toISOString(),
      recommendations: [
        {
          topic: 'Async JavaScript patterns',
          confidencePercent: 82,
          rationale:
            'Confusion spikes in 3 sessions across batches; pulse feedback cites event-loop clarity.',
          affectedBatchIds: validIds,
          suggestedAction: 'extend-session',
        },
        {
          topic: 'REST API design fundamentals',
          confidencePercent: 74,
          rationale: 'Quiz scores below cohort average on HTTP verbs and status codes modules.',
          affectedBatchIds: validIds.filter((id) => id === 'B-2025-13'),
          suggestedAction: 'revise-content',
        },
      ],
    };
  },

  async getCohortComparison(batchA: string, batchB: string): Promise<CohortComparisonResponse | null> {
    const metricsA = BATCH_METRICS[batchA];
    const metricsB = BATCH_METRICS[batchB];

    if (!metricsA || !metricsB) {
      return null;
    }

    const deltas = buildMetricDelta(metricsA, metricsB);

    return {
      batchA: { batchId: batchA, metrics: metricsA },
      batchB: { batchId: batchB, metrics: metricsB },
      metrics: deltas,
      insights: [
        `${batchB} feedback completion is ${deltas.feedbackCompletion.delta}pp higher than ${batchA}.`,
        `${batchB} readiness score leads by ${deltas.readinessScore.delta} points.`,
      ],
    };
  },

  async getTopPerformers(batchId: string): Promise<TopPerformersResponse | null> {
    if (!KNOWN_BATCHES.has(batchId)) {
      return null;
    }

    return {
      batchId,
      topPercentile: 10,
      totalMavericks: 10,
      performers: [
        {
          maverickId: 'mav-001',
          displayName: 'Alex Chen',
          compositeScore: 94,
          rank: 1,
          sonicNominationEligible: true,
          strideFastTrackEligible: true,
        },
        {
          maverickId: 'mav-003',
          displayName: 'Jordan Lee',
          compositeScore: 91,
          rank: 2,
          sonicNominationEligible: true,
          strideFastTrackEligible: false,
        },
      ],
    };
  },

  async getReminderTiming(batchId: string): Promise<ReminderTimingResponse | null> {
    if (!KNOWN_BATCHES.has(batchId)) {
      return null;
    }

    return {
      batchId,
      modelVersion: 'stub-v1',
      maverickTimings: [
        {
          maverickId: 'mav-004',
          optimalHourUtc: 14,
          engagementScore: 0.82,
          preferredChannel: 'email',
        },
        {
          maverickId: 'mav-005',
          optimalHourUtc: 18,
          engagementScore: 0.71,
          preferredChannel: 'sms',
        },
      ],
    };
  },
});
