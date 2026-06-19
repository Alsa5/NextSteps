import { describe, expect, it } from 'vitest';
import { GoogleMeetClient } from '../../../src/integrations/google-meet/meet-client.js';
import { loadGoogleMeetOAuthConfig } from '../../../src/integrations/google-meet/oauth-config.js';

describe('GoogleMeetClient', () => {
  const stubConfig = loadGoogleMeetOAuthConfig({ GOOGLE_MEET_STUB_MODE: 'true' });

  it('builds an authorization URL with configured scopes and state', () => {
    const client = new GoogleMeetClient({
      ...stubConfig,
      clientId: 'test-client-id',
      stubMode: false,
    });

    const url = client.buildAuthorizationUrl({ state: 'session-link-42' });

    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('response_type=code');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=consent');
    expect(url).toContain('state=session-link-42');
    expect(url).toContain(
      encodeURIComponent('https://www.googleapis.com/auth/meetings.space.readonly'),
    );
  });

  it('returns stub conference records in stub mode', async () => {
    const client = new GoogleMeetClient(stubConfig);

    const records = await client.listConferenceRecords({ meetingCode: 'abc-defg-hij' });

    expect(records.length).toBeGreaterThan(0);
    expect(records[0]).toMatchObject({
      name: expect.stringContaining('conferenceRecords/'),
      meetingCode: 'abc-defg-hij',
    });
  });

  it('returns stub transcript segments in stub mode', async () => {
    const client = new GoogleMeetClient(stubConfig);

    const transcript = await client.fetchTranscript('conferenceRecords/stub-record-1');

    expect(transcript.conferenceRecordId).toBe('conferenceRecords/stub-record-1');
    expect(transcript.segments.length).toBeGreaterThan(0);
    expect(transcript.segments[0]).toMatchObject({
      text: expect.any(String),
      startTime: expect.any(String),
      endTime: expect.any(String),
    });
    expect(transcript.source).toBe('stub');
  });

  it('reports configured=false when credentials missing in stub mode', () => {
    const client = new GoogleMeetClient(stubConfig);

    expect(client.isConfigured()).toBe(false);
    expect(client.isStubMode()).toBe(true);
  });

  it('reports configured=true when live credentials are present', () => {
    const client = new GoogleMeetClient({
      ...stubConfig,
      stubMode: false,
      clientId: 'live-client',
      clientSecret: 'live-secret',
    });

    expect(client.isConfigured()).toBe(true);
    expect(client.isStubMode()).toBe(false);
  });

  it('uses the Meet REST API base URL for live fetch helpers', () => {
    const client = new GoogleMeetClient(stubConfig);

    expect(client.getApiBaseUrl()).toBe('https://meet.googleapis.com/v2');
  });
});
