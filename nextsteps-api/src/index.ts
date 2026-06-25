import { Queue } from 'bullmq';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './db/mongo.js';
import { isRedisAvailable } from './lib/redis.js';
import {
  createRoleMappingRepository,
  DEFAULT_DESIGNATION_MAPPINGS,
} from './repositories/role-mapping-repository.js';
import { createTraineeRegistryRepository } from './repositories/trainee-registry-repository.js';
import { createUserRepository } from './repositories/user-repository.js';
import { createInMemoryFeedbackCompletionRepository } from './repositories/in-memory-feedback-completion.js';
import { createGoogleOAuthTokenRepository } from './repositories/google-oauth-token-repository.js';
import { createSessionStore } from './repositories/session-store.js';
import { createNotificationRepository } from './repositories/notification-repository.js';
import { createInMemoryAuditLogRepository } from './repositories/in-memory-audit-log.js';
import { createInMemoryP7AnalyticsRepository } from './repositories/in-memory-p7-analytics.js';
import { runSessionTranscriptPipeline } from './services/session-pipeline.js';
import {
  JOB_COMPUTE_REMINDER_TIMING,
  JOB_EVALUATE_BATCH_XP_BONUS,
  JOB_GENERATE_EXECUTIVE_REPORT,
  JOB_INGEST_MEET_TRANSCRIPT,
  JOB_SEND_FEEDBACK_REMINDER,
  type ComputeReminderTimingPayload,
  type EvaluateBatchXpBonusPayload,
  type GenerateExecutiveReportPayload,
  type IngestMeetTranscriptPayload,
  type SendFeedbackReminderPayload,
} from './models/queue-names.js';
import { seedDevPersonalUsers } from './services/seed-dev-users.js';
import { seedTraineeRegistry } from './services/seed-trainee-registry.js';
import { seedTrainerScoresDevData } from './services/seed-trainer-scores.js';
import { startWorkers } from './worker/start-workers.js';

const port = Number(env.Port);

const bootstrap = async (): Promise<void> => {
  await connectMongo();

  const users = createUserRepository();
  const traineeRegistry = createTraineeRegistryRepository();
  const roleMappings = createRoleMappingRepository();
  await roleMappings.seedDefaults(DEFAULT_DESIGNATION_MAPPINGS);
  if (env.NodeEnv !== 'production') {
    await seedDevPersonalUsers(users);
    await seedTraineeRegistry(traineeRegistry);
    await seedTrainerScoresDevData();
    console.log('Seeded dev personal-email accounts for magic-link sign-in');
    console.log('Seeded trainee registry (roster sign-in enabled, queue blocked)');
    console.log('Seeded trainer scores and session feedback (dev data only)');
  }
  const feedbackCompletion = createInMemoryFeedbackCompletionRepository();
  const sessions = createSessionStore();
  const notifications = createNotificationRepository();
  const googleTokens = createGoogleOAuthTokenRepository();

  let redisReady = env.RedisEnabled;
  if (redisReady) {
    redisReady = await isRedisAvailable(env.RedisUrl);
    if (!redisReady) {
      console.warn(
        'Redis unavailable at',
        env.RedisUrl,
        '— background workers disabled. SSO and REST API still work.',
      );
      console.warn('Start Redis locally or set REDIS_ENABLED=false to suppress this check.');
    }
  } else {
    console.log('Redis disabled via REDIS_ENABLED=false — background workers skipped.');
  }

  const connection = { url: env.RedisUrl };
  let ingestQueue: Queue<IngestMeetTranscriptPayload> | null = null;
  let reminderQueue: Queue<SendFeedbackReminderPayload> | null = null;
  let xpBonusQueue: Queue<EvaluateBatchXpBonusPayload> | null = null;
  let executiveReportQueue: Queue<GenerateExecutiveReportPayload> | null = null;
  let reminderTimingQueue: Queue<ComputeReminderTimingPayload> | null = null;

  if (redisReady) {
    ingestQueue = new Queue<IngestMeetTranscriptPayload>(JOB_INGEST_MEET_TRANSCRIPT, {
      connection,
    });
    reminderQueue = new Queue<SendFeedbackReminderPayload>(JOB_SEND_FEEDBACK_REMINDER, {
      connection,
    });
    xpBonusQueue = new Queue<EvaluateBatchXpBonusPayload>(JOB_EVALUATE_BATCH_XP_BONUS, {
      connection,
    });
    executiveReportQueue = new Queue<GenerateExecutiveReportPayload>(JOB_GENERATE_EXECUTIVE_REPORT, {
      connection,
    });
    reminderTimingQueue = new Queue<ComputeReminderTimingPayload>(JOB_COMPUTE_REMINDER_TIMING, {
      connection,
    });
  }

  const app = createApp({
    enqueueIngestMeetTranscript: async (payload) => {
      if (!ingestQueue) {
        await runSessionTranscriptPipeline(sessions, payload.sessionId);
        return { jobId: 'sync' };
      }

      const job = await ingestQueue.add(JOB_INGEST_MEET_TRANSCRIPT, payload, {
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      return { jobId: String(job.id) };
    },
    enqueueSendFeedbackReminder: async (payload) => {
      if (!reminderQueue) {
        throw new Error('Background job queue unavailable (Redis is not running)');
      }

      const job = await reminderQueue.add(JOB_SEND_FEEDBACK_REMINDER, payload, {
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      return { jobId: String(job.id) };
    },
    enqueueEvaluateBatchXpBonus: async (payload) => {
      if (!xpBonusQueue) {
        throw new Error('Background job queue unavailable (Redis is not running)');
      }

      const job = await xpBonusQueue.add(JOB_EVALUATE_BATCH_XP_BONUS, payload, {
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      return { jobId: String(job.id) };
    },
    enqueueGenerateExecutiveReport: async (payload) => {
      if (!executiveReportQueue) {
        throw new Error('Background job queue unavailable (Redis is not running)');
      }

      const job = await executiveReportQueue.add(JOB_GENERATE_EXECUTIVE_REPORT, payload, {
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      return { jobId: String(job.id) };
    },
    analytics: sessions,
    sessions,
    notifications,
    googleTokens,
    feedbackCompletion,
    p7Analytics: createInMemoryP7AnalyticsRepository(),
    auditLog: createInMemoryAuditLogRepository(),
    users,
    roleMappings,
    traineeRegistry,
    jwtSecret: env.JwtSecret,
    corsOrigin: env.CorsOrigin,
  });

  app.listen(port, () => {
    console.log(`nextsteps-api listening on http://localhost:${port}`);
    console.log(`MongoDB database: ${env.MongoDbDatabase}`);
  });

  if (redisReady) {
    await startWorkers(connection, sessions);
  }
};

bootstrap().catch((error) => {
  console.error('Failed to start nextsteps-api:', error);
  process.exit(1);
});
