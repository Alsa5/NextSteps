import type { Collection } from 'mongodb';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { P7AnalyticsRepository } from './p7-analytics.js';
import type {
  CohortComparisonResponse,
  CohortMetrics,
  CurriculumCopilotResponse,
  ReminderTimingResponse,
  TopPerformersResponse,
} from '../types/p7-analytics.js';

interface P7BatchMetricsDoc {
  batchId: string;
  metrics: CohortMetrics;
}

interface P7TopPerformersDoc extends TopPerformersResponse {
  batchId: string;
}

interface P7ReminderTimingsDoc extends ReminderTimingResponse {
  batchId: string;
}

interface P7CurriculumDoc {
  batchId: string;
  recommendations: CurriculumCopilotResponse['recommendations'];
}

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

export const createMongoP7AnalyticsRepository = (): P7AnalyticsRepository => {
  const metricsCol = (): Collection<P7BatchMetricsDoc> =>
    getDb().collection<P7BatchMetricsDoc>(NEXTSTEPS_COLLECTIONS.P7_BATCH_METRICS);

  const performersCol = (): Collection<P7TopPerformersDoc> =>
    getDb().collection<P7TopPerformersDoc>(NEXTSTEPS_COLLECTIONS.P7_TOP_PERFORMERS);

  const timingsCol = (): Collection<P7ReminderTimingsDoc> =>
    getDb().collection<P7ReminderTimingsDoc>(NEXTSTEPS_COLLECTIONS.P7_REMINDER_TIMINGS);

  const curriculumCol = (): Collection<P7CurriculumDoc> =>
    getDb().collection<P7CurriculumDoc>(NEXTSTEPS_COLLECTIONS.P7_CURRICULUM_RECOMMENDATIONS);

  return {
    async batchExists(batchId) {
      const doc = await metricsCol().findOne({ batchId });
      return doc !== null;
    },

    async getCurriculumRecommendations(batchIds) {
      const docs = await curriculumCol()
        .find({ batchId: { $in: batchIds } })
        .toArray();

      const validIds = docs.map((d) => d.batchId);
      if (validIds.length === 0) {
        return null;
      }

      const recommendations = docs.flatMap((d) => d.recommendations);

      return {
        batchIds: validIds,
        generatedAt: new Date().toISOString(),
        recommendations,
      };
    },

    async getCohortComparison(batchA, batchB) {
      const [docA, docB] = await Promise.all([
        metricsCol().findOne({ batchId: batchA }),
        metricsCol().findOne({ batchId: batchB }),
      ]);

      if (!docA || !docB) {
        return null;
      }

      const deltas = buildMetricDelta(docA.metrics, docB.metrics);

      return {
        batchA: { batchId: batchA, metrics: docA.metrics },
        batchB: { batchId: batchB, metrics: docB.metrics },
        metrics: deltas,
        insights: [
          `${batchB} feedback completion is ${deltas.feedbackCompletion.delta}pp higher than ${batchA}.`,
          `${batchB} readiness score leads by ${deltas.readinessScore.delta} points.`,
        ],
      };
    },

    async getTopPerformers(batchId) {
      const doc = await performersCol().findOne({ batchId });
      if (!doc) {
        return null;
      }

      return {
        batchId: doc.batchId,
        topPercentile: doc.topPercentile,
        totalMavericks: doc.totalMavericks,
        performers: doc.performers,
      };
    },

    async getReminderTiming(batchId) {
      const doc = await timingsCol().findOne({ batchId });
      if (!doc) {
        return null;
      }

      return {
        batchId: doc.batchId,
        modelVersion: doc.modelVersion,
        maverickTimings: doc.maverickTimings,
      };
    },
  };
};
