import { randomUUID } from 'crypto';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { SessionFeedbackSubmission, MoodType } from '../types/session-feedback.js';

export interface SessionFeedbackRepository {
  insert(submission: Omit<SessionFeedbackSubmission, '_id'>): Promise<SessionFeedbackSubmission>;
  findBySessionId(sessionId: string): Promise<SessionFeedbackSubmission[]>;
  findByBatchId(batchId: string): Promise<SessionFeedbackSubmission[]>;
  findByTrainerEmail(trainerEmail: string): Promise<SessionFeedbackSubmission[]>;
  countBySessionId(sessionId: string): Promise<number>;
}

export const createSessionFeedbackRepository = (): SessionFeedbackRepository => {
  const collection = () =>
    getDb().collection<SessionFeedbackSubmission>('session_feedback');

  return {
    async insert(submission) {
      const feedbackDoc: SessionFeedbackSubmission = {
        _id: randomUUID(),
        ...submission,
        submittedAt: submission.submittedAt || new Date().toISOString(),
      };
      
      await collection().insertOne(feedbackDoc);
      return feedbackDoc;
    },

    async findBySessionId(sessionId) {
      return collection()
        .find({ sessionId })
        .sort({ submittedAt: -1 })
        .toArray();
    },

    async findByBatchId(batchId) {
      return collection()
        .find({ batchId })
        .sort({ submittedAt: -1 })
        .toArray();
    },

    async findByTrainerEmail(trainerEmail) {
      return collection()
        .find({ trainerEmail })
        .sort({ submittedAt: -1 })
        .toArray();
    },

    async countBySessionId(sessionId) {
      return collection().countDocuments({ sessionId });
    },
  };
};