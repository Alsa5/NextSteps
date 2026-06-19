import type { NextStepsUser } from '../db/schemas.js';
import type { TraineeRegistryRepository } from '../repositories/trainee-registry-repository.js';
import type { UserRepository } from '../repositories/user-repository.js';
import { isHexawareEmail } from './email-auth.js';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const QUEUE_SIGN_IN_MESSAGE =
  'You are on the recruitment queue. Sign-in is available after L&D assigns you to a batch.';

export const ROSTER_SIGN_IN_MESSAGE =
  'This email is not on the trainee roster. Contact your L&D coordinator.';

/**
 * Personal-email sign-in: roster trainees with a batch may sign in;
 * queue-only recruits (no batch) are blocked. Trainers/seed users without
 * a registry row still work via the users collection.
 */
export const resolvePersonalEmailUser = async (
  email: string,
  users: UserRepository,
  registry: TraineeRegistryRepository,
): Promise<NextStepsUser> => {
  const normalized = normalizeEmail(email);

  if (isHexawareEmail(normalized)) {
    throw new Error('Use Microsoft SSO for your Hexaware corporate account');
  }

  const rosterEntry = await registry.findByEmail(normalized);

  if (rosterEntry) {
    if (!rosterEntry.signInEligible) {
      throw new Error(QUEUE_SIGN_IN_MESSAGE);
    }

    const existing = await users.findByEmail(normalized);
    if (existing) {
      return existing;
    }

    return users.upsertUser(normalized, {
      fullName: rosterEntry.fullName,
      role: 'maverick',
      authProvider: 'email',
    });
  }

  const existing = await users.findByEmail(normalized);
  if (!existing) {
    throw new Error(ROSTER_SIGN_IN_MESSAGE);
  }

  return existing;
};
