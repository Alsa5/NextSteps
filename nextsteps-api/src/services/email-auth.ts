import { randomBytes, randomInt } from 'crypto';
import type { UserRepository } from '../repositories/user-repository.js';
import type { NextStepsUser } from '../db/schemas.js';
import type { UserRole } from '../types/auth.js';

const HEXAWARE_DOMAIN = '@hexaware.com';
const TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export interface MagicLinkRecord {
  email: string;
  userId: string;
  role: UserRole;
  expiresAt: number;
}

export interface OtpRecord {
  email: string;
  userId: string;
  role: UserRole;
  code: string;
  expiresAt: number;
  attempts: number;
}

const magicLinkStore = new Map<string, MagicLinkRecord>();
const otpStore = new Map<string, OtpRecord>();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const isHexawareEmail = (email: string): boolean =>
  normalizeEmail(email).endsWith(HEXAWARE_DOMAIN);

/** Personal email path: roster mavericks + trainers. Queue-only recruits blocked via registry. */
export const PERSONAL_EMAIL_ROLES: UserRole[] = ['maverick', 'trainer'];

/** SSO path: mavericks in training, managers, and L&D on corporate email. */
export const SSO_ALLOWED_ROLES: UserRole[] = ['maverick', 'manager', 'ld'];

export const assertPersonalEmailSignIn = (
  user: NextStepsUser | null,
  email: string,
): NextStepsUser => {
  const normalized = normalizeEmail(email);

  if (isHexawareEmail(normalized)) {
    throw new Error('Use Microsoft SSO for your Hexaware corporate account');
  }

  if (!user) {
    throw new Error('This email is not registered on the trainee roster. Contact your L&D coordinator.');
  }

  if (!PERSONAL_EMAIL_ROLES.includes(user.role)) {
    throw new Error('Use Microsoft SSO for L&D and Manager access');
  }

  return user;
};

export const assertSsoSignIn = (user: NextStepsUser): NextStepsUser => {
  if (user.role === 'trainer') {
    throw new Error('Trainers should sign in with their personal email');
  }

  if (!SSO_ALLOWED_ROLES.includes(user.role)) {
    throw new Error('Your account is not enabled for corporate sign-in');
  }

  return user;
};

export const createMagicLinkToken = (
  user: NextStepsUser,
): { token: string; expiresAt: number } => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_TTL_MS;

  magicLinkStore.set(token, {
    email: user.email,
    userId: user._id,
    role: user.role,
    expiresAt,
  });

  return { token, expiresAt };
};

export const createOtpCode = (): string =>
  String(randomInt(100000, 1000000));

export const createMagicLinkWithOtp = (
  user: NextStepsUser,
): { token: string; otp: string; expiresAt: number } => {
  const { token, expiresAt } = createMagicLinkToken(user);
  const otp = createOtpCode();

  otpStore.set(normalizeEmail(user.email), {
    email: user.email,
    userId: user._id,
    role: user.role,
    code: otp,
    expiresAt,
    attempts: 0,
  });

  return { token, otp, expiresAt };
};

export const consumeOtp = (
  email: string,
  code: string,
  users: UserRepository,
): Promise<NextStepsUser | null> => {
  const normalized = normalizeEmail(email);
  const record = otpStore.get(normalized);
  if (!record) {
    return Promise.resolve(null);
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalized);
    return Promise.resolve(null);
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(normalized);
    return Promise.resolve(null);
  }

  if (record.code !== code.trim()) {
    record.attempts += 1;
    otpStore.set(normalized, record);
    return Promise.resolve(null);
  }

  otpStore.delete(normalized);
  return users.findById(record.userId);
};

export const consumeMagicLinkToken = (
  token: string,
  users: UserRepository,
): Promise<NextStepsUser | null> => {
  const record = magicLinkStore.get(token);
  if (!record) {
    return Promise.resolve(null);
  }

  if (Date.now() > record.expiresAt) {
    magicLinkStore.delete(token);
    return Promise.resolve(null);
  }

  magicLinkStore.delete(token);
  return users.findById(record.userId);
};

export const purgeExpiredMagicLinks = (): void => {
  const now = Date.now();
  for (const [token, record] of magicLinkStore.entries()) {
    if (record.expiresAt <= now) {
      magicLinkStore.delete(token);
    }
  }

  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt <= now) {
      otpStore.delete(email);
    }
  }
};
