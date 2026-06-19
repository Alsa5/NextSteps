import { describe, expect, it } from 'vitest';
import { isTraineeSignInEligible } from '../../src/repositories/trainee-registry-repository.js';
import { QUEUE_SIGN_IN_MESSAGE } from '../../src/services/personal-email-auth.js';

describe('trainee sign-in eligibility', () => {
  it('allows roster trainees with a batch', () => {
    expect(isTraineeSignInEligible('B-2025-14')).toBe(true);
    expect(isTraineeSignInEligible('B-2026-01')).toBe(true);
  });

  it('blocks recruitment queue recruits without a batch', () => {
    expect(isTraineeSignInEligible(null)).toBe(false);
    expect(isTraineeSignInEligible('')).toBe(false);
    expect(isTraineeSignInEligible(undefined)).toBe(false);
  });

  it('uses a clear queue message constant', () => {
    expect(QUEUE_SIGN_IN_MESSAGE).toContain('recruitment queue');
  });
});
