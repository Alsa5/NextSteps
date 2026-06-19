import { describe, expect, it } from 'vitest';
import { isAppAdmin, getAppAdminEmails } from '../src/services/app-admin.js';

describe('app-admin', () => {
  it('includes designated admin emails', () => {
    const emails = getAppAdminEmails();
    expect(emails).toContain('sakthia2@hexaware.com');
    expect(emails).toContain('2000147951@hexaware.com');
  });

  it('matches admin emails case-insensitively', () => {
    expect(isAppAdmin('SakthiA2@hexaware.com')).toBe(true);
    expect(isAppAdmin('2000147951@hexaware.com')).toBe(true);
    expect(isAppAdmin('other@hexaware.com')).toBe(false);
  });
});
