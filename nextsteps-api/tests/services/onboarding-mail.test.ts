import { describe, expect, it } from 'vitest';
import {
  buildOnboardingMailContent,
  generateEmployeeCredentials,
} from '../../src/services/onboarding-mail.js';

describe('onboarding-mail', () => {
  it('builds template with role, location, date, and reporting time', () => {
    const credentials = { employeeId: 'HW123456', hexEmail: 'madhav.v@hexaware.com' };
    const { subject, text, html } = buildOnboardingMailContent(
      {
        traineeName: 'madhav v s',
        personalEmail: 'madhavvs276@gmail.com',
        batch: 'B-2025-14',
        track: 'GET',
        role: 'Associate Software Engineer — GET Track',
        location: 'Hexaware Chennai — Global Delivery Center, Siruseri',
        onboardingDate: '2026-06-15',
        reportingTime: '09:00 AM',
      },
      credentials,
    );

    expect(subject).toContain('Onboarding');
    expect(text).toContain('Associate Software Engineer — GET Track');
    expect(text).toContain('Hexaware Chennai');
    expect(text).toContain('09:00 AM');
    expect(html).toContain('B-2025-14');
    expect(html).toContain('HW123456');
  });

  it('generates employee credentials from trainee name', () => {
    const creds = generateEmployeeCredentials('Priya Sharma');
    expect(creds.employeeId).toMatch(/^HW\d{6}$/);
    expect(creds.hexEmail).toBe('priya.sharma@hexaware.com');
  });
});
