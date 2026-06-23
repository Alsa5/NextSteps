import type { ConnectionOptions, Worker } from 'bullmq';
import { getDb } from '../db/mongo.js';
import { createMongoFeedbackCompletionRepository } from '../repositories/mongo-feedback-completion-repository.js';
import { StubGoogleMeetClient } from './clients/google-meet-client.js';
import { createSessionRepository, createTranscriptRepository } from './db/repositories.js';
import { buildEvaluateBatchXpBonusDepsFromRepository } from './jobs/evaluate-batch-xp-bonus.js';
import { createStubSendFeedbackReminderDeps } from './jobs/send-feedback-reminder.js';
import type { SessionStore } from '../repositories/session-store.js';
import {
  createAnalyzeSessionSentimentQueue,
  registerEvaluateBatchXpBonusWorker,
  registerAnalyzeSessionSentimentWorker,
  registerIngestMeetTranscriptWorker,
  registerPurgeExpiredDataWorker,
  registerSendFeedbackReminderWorker,
} from './jobs/queues.js';
import { createStubPurgeExpiredDataDeps } from './jobs/purge-expired-data.js';

export const startWorkers = async (
  connection: ConnectionOptions,
  sessions: SessionStore,
): Promise<Worker[]> => {
  try {
    const db = getDb();
    const analyzeQueue = createAnalyzeSessionSentimentQueue({ connection });
    const feedbackCompletion = createMongoFeedbackCompletionRepository();

    const workers: Worker[] = [
      registerIngestMeetTranscriptWorker(
        {
          meetClient: new StubGoogleMeetClient(),
          sessionRepository: createSessionRepository(db),
          transcriptRepository: createTranscriptRepository(db),
          analyzeQueue,
          sessionExists: async (sessionId) => {
            const s = await sessions.getSession(sessionId);
            if (s) return true;
            return createSessionRepository(db).exists(sessionId);
          },
        },
        connection,
      ),
      registerAnalyzeSessionSentimentWorker({ sessions }, connection),
      registerSendFeedbackReminderWorker(createStubSendFeedbackReminderDeps(), connection),
      registerEvaluateBatchXpBonusWorker(
        buildEvaluateBatchXpBonusDepsFromRepository(feedbackCompletion),
        connection,
      ),
      registerPurgeExpiredDataWorker(createStubPurgeExpiredDataDeps(), connection),
    ];

    for (const worker of workers) {
      worker.on('completed', (job) => {
        console.log(`[${job.name}] completed`, job.data);
      });

      worker.on('failed', (job, error: Error) => {
        console.error(`[${job?.name}] failed`, error);
      });
    }

    console.log(
      'nextsteps-api workers listening for ingest-meet-transcript, send-feedback-reminder, evaluate-batch-xp-bonus, purge-expired-data jobs',
    );
    return workers;
  } catch (error) {
    console.warn('Background workers disabled:', error instanceof Error ? error.message : error);
    return [];
  }
};
