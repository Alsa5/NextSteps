export interface CreateCalendarMeetInput {
  title: string;
  description: string;
  scheduledAt: string;
  durationMinutes?: number;
  attendees: Array<{ email: string; name?: string }>;
  timeZone?: string;
}

export interface CreateCalendarMeetResult {
  meetLink: string;
  meetCode: string;
  calendarEventId: string;
  htmlLink: string;
}

const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

const extractMeetCode = (meetLink: string): string => {
  try {
    const url = new URL(meetLink);
    return url.pathname.replace(/^\//, '').split('?')[0] ?? meetLink;
  } catch {
    return meetLink;
  }
};

const addMinutes = (iso: string, minutes: number): string => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
};

export const createCalendarMeetEvent = async (
  accessToken: string,
  input: CreateCalendarMeetInput,
): Promise<CreateCalendarMeetResult> => {
  const timeZone = input.timeZone ?? DEFAULT_TIMEZONE;
  const duration = input.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const start = new Date(input.scheduledAt).toISOString();
  const end = addMinutes(start, duration);
  const requestId = `nextsteps-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const uniqueAttendees = new Map<string, { email: string; displayName?: string }>();
  for (const a of input.attendees) {
    uniqueAttendees.set(a.email.toLowerCase(), {
      email: a.email,
      displayName: a.name,
    });
  }

  const eventBody = {
    summary: input.title,
    description: input.description,
    start: { dateTime: start, timeZone },
    end: { dateTime: end, timeZone },
    attendees: [...uniqueAttendees.values()].map((a) => ({
      email: a.email,
      displayName: a.displayName,
    })),
    conferenceData: {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('conferenceDataVersion', '1');
  url.searchParams.set('sendUpdates', 'all');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Google Calendar event creation failed: ${errText}`);
  }

  const event = (await response.json()) as {
    id?: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: {
      entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
    };
  };

  const meetLink =
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ??
    '';

  if (!meetLink) {
    throw new Error('Calendar event created but no Google Meet link was returned');
  }

  return {
    meetLink,
    meetCode: extractMeetCode(meetLink),
    calendarEventId: event.id ?? '',
    htmlLink: event.htmlLink ?? meetLink,
  };
};
