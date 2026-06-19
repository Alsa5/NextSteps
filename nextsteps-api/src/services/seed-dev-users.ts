import type { UserRepository } from '../repositories/user-repository.js';
import type { UserRole } from '../types/auth.js';

const DEV_PERSONAL_ACCOUNTS: Array<{
  email: string;
  fullName: string;
  role: UserRole;
}> = [
  {
    email: 'sakthialagappan67@gmail.com',
    fullName: 'Sakthi Alagappan',
    role: 'maverick',
  },
  {
    email: 'priya.sharma@gmail.com',
    fullName: 'Priya Sharma',
    role: 'maverick',
  },
  {
    email: 'arjun.reddy@gmail.com',
    fullName: 'Arjun Reddy',
    role: 'maverick',
  },
  {
    email: 'trainer.demo@external.com',
    fullName: 'Demo Trainer',
    role: 'trainer',
  },
];

/** Ensures onboarded personal-email users exist for magic-link / OTP sign-in in dev. */
export const seedDevPersonalUsers = async (users: UserRepository): Promise<void> => {
  await Promise.all(
    DEV_PERSONAL_ACCOUNTS.map((account) =>
      users.upsertUser(account.email, {
        fullName: account.fullName,
        role: account.role,
        authProvider: 'email',
      }),
    ),
  );
};
