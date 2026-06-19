import type {
  BatchFeedbackDashboard,
  FeedbackSubmissionRecord,
} from '../types/feedback-completion.js';

export interface FeedbackCompletionRepository {
  getBatchDashboard(batchId: string): Promise<BatchFeedbackDashboard | null>;
  getBatchCohortSize(batchId: string): Promise<number>;
  isTrainerForBatch(trainerId: string, batchId: string): Promise<boolean>;
  recordFeedbackSubmission(record: FeedbackSubmissionRecord): Promise<void>;
  getBatchCompletionPercent(batchId: string): Promise<number>;
  hasBatchXpBonusAwarded(batchId: string): Promise<boolean>;
  markBatchXpBonusAwarded(batchId: string): Promise<void>;
}
