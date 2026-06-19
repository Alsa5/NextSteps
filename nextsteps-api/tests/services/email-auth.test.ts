import { describe, expect, it } from 'vitest';
import { assertSsoSignIn } from '../../src/services/email-auth.js';
import type { NextStepsUser } from '../../src/db/schemas.js';

const trainerUser = {
  _id: 'tr-001',
  email: 'trainer.demo@external.com',
  fullName: 'Demo Trainer',
  role: 'trainer',
} as NextStepsUser;

describe('assertSsoSignIn', () => {
  it('rejects trainer role for standard corporate SSO', () => {
    expect(() => assertSsoSignIn(trainerUser)).toThrow(
      'Trainers should sign in with their personal email',
    );
  });
});
