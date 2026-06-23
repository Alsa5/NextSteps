import type { AppDeps } from '../../src/app.js';
import { createInMemoryAuditLogRepository } from '../../src/repositories/in-memory-audit-log.js';
import { createInMemoryFeedbackCompletionRepository } from '../../src/repositories/in-memory-feedback-completion.js';
import { createInMemoryP7AnalyticsRepository } from '../../src/repositories/in-memory-p7-analytics.js';
import { createNotificationRepository } from '../../src/repositories/notification-repository.js';
import { createSessionStore } from '../../src/repositories/session-store.js';
import { createGoogleOAuthTokenRepository } from '../../src/repositories/google-oauth-token-repository.js';
import { createRoleMappingRepository } from '../../src/repositories/role-mapping-repository.js';
import { createTraineeRegistryRepository } from '../../src/repositories/trainee-registry-repository.js';
import { createUserRepository } from '../../src/repositories/user-repository.js';

export const createBaseTestDeps = (overrides: Partial<AppDeps> = {}): AppDeps => {
  const sessions = createSessionStore();
  return {
    enqueueIngestMeetTranscript: async () => ({ jobId: 'job-test' }),
    enqueueSendFeedbackReminder: async () => ({ jobId: 'reminder-test' }),
    enqueueEvaluateBatchXpBonus: async () => ({ jobId: 'xp-test' }),
    enqueueGenerateExecutiveReport: async () => ({ jobId: 'report-test' }),
    analytics: sessions,
    sessions,
    notifications: createNotificationRepository(),
    googleTokens: createGoogleOAuthTokenRepository(),
    feedbackCompletion: createInMemoryFeedbackCompletionRepository(),
    p7Analytics: createInMemoryP7AnalyticsRepository(),
    auditLog: createInMemoryAuditLogRepository(),
    users: createUserRepository(),
    roleMappings: createRoleMappingRepository(),
    traineeRegistry: createTraineeRegistryRepository(),
    jwtSecret: 'test-jwt-secret',
    corsOrigin: '*',
    ...overrides,
  };
};
