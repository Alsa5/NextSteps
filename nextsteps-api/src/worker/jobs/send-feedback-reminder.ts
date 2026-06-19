import type { ReminderTier } from '../../types/feedback-completion.js';

export interface SendFeedbackReminderPayload {
  sessionId: string;
  batchId: string;
  tier: ReminderTier;
  pendingMaverickIds: string[];
  trainerId?: string;
}

export interface SendFeedbackReminderResult {
  sessionId: string;
  batchId: string;
  tier: ReminderTier;
  remindersSent: number;
  trainerEscalated: boolean;
}

export interface NotificationDeliveryResult {
  channel: 'email-stub' | 'sms-stub';
  delivered: boolean;
}

export interface SendFeedbackReminderDeps {
  sendMaverickReminder(input: {
    sessionId: string;
    batchId: string;
    tier: ReminderTier;
    maverickId: string;
  }): Promise<NotificationDeliveryResult>;
  notifyTrainerEscalation(input: {
    sessionId: string;
    batchId: string;
    trainerId: string;
    pendingMaverickIds: string[];
  }): Promise<NotificationDeliveryResult>;
}

export const createSendFeedbackReminderHandler =
  (deps: SendFeedbackReminderDeps) =>
  async (payload: SendFeedbackReminderPayload): Promise<SendFeedbackReminderResult> => {
    let remindersSent = 0;

    for (const maverickId of payload.pendingMaverickIds) {
      await deps.sendMaverickReminder({
        sessionId: payload.sessionId,
        batchId: payload.batchId,
        tier: payload.tier,
        maverickId,
      });
      remindersSent += 1;
    }

    let trainerEscalated = false;
    if (payload.tier === 2 && payload.trainerId) {
      await deps.notifyTrainerEscalation({
        sessionId: payload.sessionId,
        batchId: payload.batchId,
        trainerId: payload.trainerId,
        pendingMaverickIds: payload.pendingMaverickIds,
      });
      trainerEscalated = true;
    }

    return {
      sessionId: payload.sessionId,
      batchId: payload.batchId,
      tier: payload.tier,
      remindersSent,
      trainerEscalated,
    };
  };

export const createStubSendFeedbackReminderDeps = (): SendFeedbackReminderDeps => ({
  sendMaverickReminder: async () => ({ channel: 'email-stub', delivered: true }),
  notifyTrainerEscalation: async () => ({ channel: 'email-stub', delivered: true }),
});
