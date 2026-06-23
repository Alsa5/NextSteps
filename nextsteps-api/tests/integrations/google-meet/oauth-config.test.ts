import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GOOGLE_MEET_SCOPES,
  loadGoogleMeetOAuthConfig,
  validateGoogleMeetOAuthConfig,
} from '../../../src/integrations/google-meet/oauth-config.js';

describe('loadGoogleMeetOAuthConfig', () => {
  it('loads stub mode by default when credentials are absent', () => {
    const config = loadGoogleMeetOAuthConfig({});

    expect(config.stubMode).toBe(true);
    expect(config.clientId).toBe('');
    expect(config.clientSecret).toBe('');
    expect(config.redirectUri).toBe('http://localhost:3003/api/v1/integrations/google/oauth/callback');
    expect(config.workspaceDomain).toBeUndefined();
    expect(config.scopes).toEqual(DEFAULT_GOOGLE_MEET_SCOPES);
  });

  it('parses explicit env overrides including custom scopes', () => {
    const config = loadGoogleMeetOAuthConfig({
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      GOOGLE_REDIRECT_URI: 'https://api.example.com/oauth/callback',
      GOOGLE_MEET_WORKSPACE_DOMAIN: 'hexaware.com',
      GOOGLE_MEET_STUB_MODE: 'false',
      GOOGLE_OAUTH_SCOPES: 'https://www.googleapis.com/auth/meetings.space.readonly,https://www.googleapis.com/auth/drive.readonly',
    });

    expect(config.stubMode).toBe(false);
    expect(config.clientId).toBe('client-id');
    expect(config.clientSecret).toBe('client-secret');
    expect(config.redirectUri).toBe('https://api.example.com/oauth/callback');
    expect(config.workspaceDomain).toBe('hexaware.com');
    expect(config.scopes).toEqual([
      'https://www.googleapis.com/auth/meetings.space.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ]);
  });
});

describe('validateGoogleMeetOAuthConfig', () => {
  it('allows stub mode without credentials', () => {
    const config = loadGoogleMeetOAuthConfig({ GOOGLE_MEET_STUB_MODE: 'true' });

    expect(() => validateGoogleMeetOAuthConfig(config)).not.toThrow();
  });

  it('requires credentials when stub mode is disabled', () => {
    const config = loadGoogleMeetOAuthConfig({
      GOOGLE_MEET_STUB_MODE: 'false',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
    });

    expect(() => validateGoogleMeetOAuthConfig(config)).toThrow(
      /GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required/,
    );
  });

  it('requires at least one OAuth scope', () => {
    const config = loadGoogleMeetOAuthConfig({
      GOOGLE_MEET_STUB_MODE: 'false',
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_OAUTH_SCOPES: '',
    });

    expect(() => validateGoogleMeetOAuthConfig(config)).toThrow(/at least one OAuth scope/);
  });
});
