import { Queue, Worker, type ConnectionOptions } from 'bullmq';
import type { GoogleMeetClient } from '../clients/google-meet-client.js';
import type { SessionRepository, TranscriptRepository } from '../db/repositories.js';
import {
  createIngestMeetTranscriptHandler,
  type IngestMeetTranscriptDeps,
} from '../jobs/ingest-meet-transcript.js';
import {
  createSendFeedbackReminderHandler,
  createStubSendFeedbackReminderDeps,
  type SendFeedbackReminderDeps,
} from '../jobs/send-feedback-reminder.js';
import {
  createEvaluateBatchXpBonusHandler,
  type EvaluateBatchXpBonusDeps,
} from '../jobs/evaluate-batch-xp-bonus.js';
import {
  createAnalyzeSessionSentimentHandler,
  type AnalyzeSessionSentimentDeps,
} from './analyze-session-sentiment.js';
import {
  createPurgeExpiredDataHandler,
  type PurgeExpiredDataDeps,
} from '../jobs/purge-expired-data.js';
import {
  JOB_ANALYZE_SESSION_SENTIMENT,
  JOB_EVALUATE_BATCH_XP_BONUS,
  JOB_INGEST_MEET_TRANSCRIPT,
  JOB_PURGE_EXPIRED_DATA,
  JOB_SEND_FEEDBACK_REMINDER,
  type AnalyzeSessionSentimentPayload,
  type EvaluateBatchXpBonusPayload,
  type IngestMeetTranscriptPayload,
  type PurgeExpiredDataPayload,
  type SendFeedbackReminderPayload,
} from '../../models/queue-names.js';

export interface QueueConnection {
  connection: ConnectionOptions;
}

export const createIngestMeetTranscriptQueue = ({ connection }: QueueConnection) =>
  new Queue<IngestMeetTranscriptPayload>(JOB_INGEST_MEET_TRANSCRIPT, { connection });

export const createAnalyzeSessionSentimentQueue = ({ connection }: QueueConnection) =>
  new Queue<AnalyzeSessionSentimentPayload>(JOB_ANALYZE_SESSION_SENTIMENT, { connection });

export const createSendFeedbackReminderQueue = ({ connection }: QueueConnection) =>
  new Queue<SendFeedbackReminderPayload>(JOB_SEND_FEEDBACK_REMINDER, { connection });

export const createEvaluateBatchXpBonusQueue = ({ connection }: QueueConnection) =>
  new Queue<EvaluateBatchXpBonusPayload>(JOB_EVALUATE_BATCH_XP_BONUS, { connection });

export interface WorkerRuntimeDeps {
  meetClient: GoogleMeetClient;
  sessionRepository: SessionRepository;
  transcriptRepository: TranscriptRepository;
  analyzeQueue: Queue<AnalyzeSessionSentimentPayload>;
  sessionExists?: (sessionId: string) => Promise<boolean>;
}

export const buildIngestMeetTranscriptDeps = (
  deps: WorkerRuntimeDeps,
): IngestMeetTranscriptDeps => ({
  sessionExists: deps.sessionExists ?? ((sessionId) => deps.sessionRepository.exists(sessionId)),
  fetchTranscript: (sessionId, meetConferenceId) =>
    deps.meetClient.fetchTranscript(sessionId, meetConferenceId),
  persistTranscript: (doc) => deps.transcriptRepository.insert(doc),
  enqueueAnalyzeSessionSentiment: async (payload) => {
    await deps.analyzeQueue.add(JOB_ANALYZE_SESSION_SENTIMENT, payload, {
      removeOnComplete: 100,
      removeOnFail: 50,
    });
  },
});

export const registerIngestMeetTranscriptWorker = (
  deps: WorkerRuntimeDeps,
  connection: ConnectionOptions,
): Worker<IngestMeetTranscriptPayload> => {
  const handler = createIngestMeetTranscriptHandler(buildIngestMeetTranscriptDeps(deps));

  return new Worker<IngestMeetTranscriptPayload>(
    JOB_INGEST_MEET_TRANSCRIPT,
    async (job) => handler(job.data),
    { connection },
  );
};

export const registerSendFeedbackReminderWorker = (
  deps: SendFeedbackReminderDeps = createStubSendFeedbackReminderDeps(),
  connection: ConnectionOptions,
): Worker<SendFeedbackReminderPayload> => {
  const handler = createSendFeedbackReminderHandler(deps);

  return new Worker<SendFeedbackReminderPayload>(
    JOB_SEND_FEEDBACK_REMINDER,
    async (job) => handler(job.data),
    { connection },
  );
};

export const registerEvaluateBatchXpBonusWorker = (
  deps: EvaluateBatchXpBonusDeps,
  connection: ConnectionOptions,
): Worker<EvaluateBatchXpBonusPayload> => {
  const handler = createEvaluateBatchXpBonusHandler(deps);

  return new Worker<EvaluateBatchXpBonusPayload>(
    JOB_EVALUATE_BATCH_XP_BONUS,
    async (job) => handler(job.data),
    { connection },
  );
};

export const registerAnalyzeSessionSentimentWorker = (
  deps: AnalyzeSessionSentimentDeps,
  connection: ConnectionOptions,
): Worker<AnalyzeSessionSentimentPayload> => {
  const handler = createAnalyzeSessionSentimentHandler(deps);

  return new Worker<AnalyzeSessionSentimentPayload>(
    JOB_ANALYZE_SESSION_SENTIMENT,
    async (job) => handler(job.data),
    { connection },
  );
};

export const registerPurgeExpiredDataWorker = (
  deps: PurgeExpiredDataDeps,
  connection: ConnectionOptions,
): Worker<PurgeExpiredDataPayload> => {
  const handler = createPurgeExpiredDataHandler(deps);

  return new Worker<PurgeExpiredDataPayload>(
    JOB_PURGE_EXPIRED_DATA,
    async () => handler(),
    { connection },
  );
};
