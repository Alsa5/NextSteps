import { env } from '../config/env.js';

const DEFAULT_APP_ADMIN_EMAILS = [
  'sakthia2@hexaware.com',
  '2000147951@hexaware.com',
];

const parseAdminEmails = (): string[] => {
  const fromEnv = env.AppAdminEmails
    ? env.AppAdminEmails.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const merged = new Set([...DEFAULT_APP_ADMIN_EMAILS, ...fromEnv]);
  return [...merged];
};

let cachedAdminEmails: string[] | null = null;

export const getAppAdminEmails = (): string[] => {
  if (!cachedAdminEmails) {
    cachedAdminEmails = parseAdminEmails();
  }
  return cachedAdminEmails;
};

export const isAppAdmin = (email: string): boolean =>
  getAppAdminEmails().includes(email.trim().toLowerCase());
