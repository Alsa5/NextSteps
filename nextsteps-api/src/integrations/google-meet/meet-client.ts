import type { GoogleMeetOAuthConfig } from './oauth-config.js';
import type {
  BuildAuthorizationUrlParams,
  ConferenceRecord,
  ListConferenceRecordsParams,
  MeetTranscript,
} from './types.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const MEET_API_BASE_URL = 'https://meet.googleapis.com/v2';

const STUB_CONFERENCE_RECORD: ConferenceRecord = {
  name: 'conferenceRecords/stub-record-1',
  meetingCode: 'abc-defg-hij',
  startTime: '2026-05-29T09:00:00.000Z',
  endTime: '2026-05-29T10:30:00.000Z',
};

const STUB_TRANSCRIPT_SEGMENTS = [
  {
    text: 'Welcome to today\'s session on cloud architecture patterns.',
    startTime: '2026-05-29T09:01:12.000Z',
    endTime: '2026-05-29T09:01:28.000Z',
  },
  {
    text: 'Let\'s review batch-level clarity signals after the breakout.',
    startTime: '2026-05-29T09:45:03.000Z',
    endTime: '2026-05-29T09:45:19.000Z',
  },
];

export class GoogleMeetClient {
  private readonly config: GoogleMeetOAuthConfig;

  constructor(config: GoogleMeetOAuthConfig) {
    this.config = config;
  }

  getApiBaseUrl(): string {
    return MEET_API_BASE_URL;
  }

  isStubMode(): boolean {
    return this.config.stubMode;
  }

  isConfigured(): boolean {
    return (
      !this.config.stubMode &&
      this.config.clientId.length > 0 &&
      this.config.clientSecret.length > 0
    );
  }

  buildAuthorizationUrl({ state }: BuildAuthorizationUrlParams): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: this.config.scopes.join(' '),
      state,
    });

    if (this.config.workspaceDomain) {
      params.set('hd', this.config.workspaceDomain);
    }

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async listConferenceRecords(
    params: ListConferenceRecordsParams,
  ): Promise<ConferenceRecord[]> {
    if (this.config.stubMode) {
      return [
        {
          ...STUB_CONFERENCE_RECORD,
          meetingCode: params.meetingCode,
        },
      ];
    }

    // Live integration lands in ALSAA-21 once OAuth tokens are persisted.
    throw new Error(
      'Live Google Meet conference record listing is not implemented in stub phase (ALSAA-20)',
    );
  }

  async fetchTranscript(conferenceRecordId: string): Promise<MeetTranscript> {
    if (this.config.stubMode) {
      return {
        conferenceRecordId,
        segments: STUB_TRANSCRIPT_SEGMENTS,
        source: 'stub',
      };
    }

    throw new Error(
      'Live Google Meet transcript fetch is not implemented in stub phase (ALSAA-20)',
    );
  }
}
