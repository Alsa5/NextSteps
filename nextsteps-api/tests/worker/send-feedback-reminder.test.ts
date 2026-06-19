import { describe, expect, it, vi } from 'vitest';
import {
  createSendFeedbackReminderHandler,
  type SendFeedbackReminderDeps,
} from '../../src/worker/jobs/send-feedback-reminder.js';

const createDeps = (overrides: Partial<SendFeedbackReminderDeps> = {}): SendFeedbackReminderDeps => ({
  sendMaverickReminder: vi.fn(async () => ({ channel: 'email-stub', delivered: true })),
  notifyTrainerEscalation: vi.fn(async () => ({ channel: 'email-stub', delivered: true })),
  ...overrides,
});

describe('send-feedback-reminder job', () => {
  it('sends tier 0 nudge to pending mavericks without trainer escalation', async () => {
    const deps = createDeps();
    const handler = createSendFeedbackReminderHandler(deps);

    const result = await handler({
      sessionId: 'ses-001',
      batchId: 'B-2025-13',
      tier: 0,
      pendingMaverickIds: ['mav-004', 'mav-005'],
    });

    expect(result.tier).toBe(0);
    expect(result.remindersSent).toBe(2);
    expect(deps.sendMaverickReminder).toHaveBeenCalledTimes(2);
    expect(deps.notifyTrainerEscalation).not.toHaveBeenCalled();
  });

  it('escalates to trainer on tier 2', async () => {
    const deps = createDeps();
    const handler = createSendFeedbackReminderHandler(deps);

    await handler({
      sessionId: 'ses-001',
      batchId: 'B-2025-13',
      tier: 2,
      pendingMaverickIds: ['mav-005'],
      trainerId: 'tr-001',
    });

    expect(deps.sendMaverickReminder).toHaveBeenCalledOnce();
    expect(deps.notifyTrainerEscalation).toHaveBeenCalledWith({
      sessionId: 'ses-001',
      batchId: 'B-2025-13',
      trainerId: 'tr-001',
      pendingMaverickIds: ['mav-005'],
    });
  });
});
