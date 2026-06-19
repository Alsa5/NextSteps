import { loadGoogleMeetOAuthConfig } from '../integrations/google-meet/oauth-config.js';
import type { GoogleOAuthTokenRepository } from '../repositories/google-oauth-token-repository.js';
import { createCalendarMeetEvent } from './google-calendar-meet.js';
import { getValidAccessToken } from './google-oauth-service.js';

const MEET_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz';

const randomSegment = (length: number): string => {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += MEET_CODE_CHARS[Math.floor(Math.random() * MEET_CODE_CHARS.length)];
  }
  return out;
};

/** Fallback when stub mode or Google not connected */
export const generateStubMeetLink = (): { meetLink: string; meetCode: string; source: 'stub' } => {
  const meetCode = `${randomSegment(3)}-${randomSegment(4)}-${randomSegment(3)}`;
  return {
    meetCode,
    meetLink: `https://meet.google.com/${meetCode}`,
    source: 'stub',
  };
};

export interface CreateMeetLinkInput {
  title: string;
  batchId: string;
  scheduledAt: string;
  trainerName: string;
  trainerEmail: string;
  recipients: Array<{ email: string; name: string }>;
}

export interface CreateMeetLinkResult {
  meetLink: string;
  meetCode: string;
  source: 'google-calendar' | 'stub';
  calendarEventId?: string;
}

export const createMeetLinkForUser = async (
  googleTokens: GoogleOAuthTokenRepository,
  userId: string,
  input: CreateMeetLinkInput,
): Promise<CreateMeetLinkResult> => {
  const config = loadGoogleMeetOAuthConfig();

  if (config.stubMode) {
    const stub = generateStubMeetLink();
    return { ...stub, source: 'stub' };
  }

  const { accessToken } = await getValidAccessToken(googleTokens, userId);

  const attendees = [
    { email: input.trainerEmail, name: input.trainerName },
    ...input.recipients,
  ];

  const calendar = await createCalendarMeetEvent(accessToken, {
    title: input.title,
    description: `NextSteps pre-onboarding session for batch ${input.batchId}.`,
    scheduledAt: input.scheduledAt,
    attendees,
  });

  return {
    meetLink: calendar.meetLink,
    meetCode: calendar.meetCode,
    source: 'google-calendar',
    calendarEventId: calendar.calendarEventId,
  };
};
