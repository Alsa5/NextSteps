export type GoogleMeetOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  workspaceDomain?: string;
  stubMode: boolean;
  scopes: string[];
};

export const DEFAULT_GOOGLE_MEET_SCOPES = [
  'https://www.googleapis.com/auth/meetings.space.readonly',
] as const;

const getDefaultRedirectUri = (): string => {
  const port = process.env.Port || process.env.PORT || '3001';
  return `http://localhost:${port}/api/v1/integrations/google/oauth/callback`;
};

const DEFAULT_REDIRECT_URI = getDefaultRedirectUri();

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return value.toLowerCase() === 'true' || value === '1';
};

const parseScopes = (value: string | undefined): string[] => {
  if (!value || value.trim() === '') {
    return [];
  }

  return value
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean);
};

export const loadGoogleMeetOAuthConfig = (
  env: NodeJS.ProcessEnv = process.env,
): GoogleMeetOAuthConfig => {
  const clientId = env.GOOGLE_CLIENT_ID?.trim() ?? '';
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim() ?? '';
  const hasCredentials = clientId.length > 0 && clientSecret.length > 0;

  return {
    clientId,
    clientSecret,
    redirectUri: env.GOOGLE_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI,
    workspaceDomain: env.GOOGLE_MEET_WORKSPACE_DOMAIN?.trim() || undefined,
    stubMode: parseBoolean(env.GOOGLE_MEET_STUB_MODE, !hasCredentials),
    scopes:
      env.GOOGLE_OAUTH_SCOPES !== undefined
        ? parseScopes(env.GOOGLE_OAUTH_SCOPES)
        : [...DEFAULT_GOOGLE_MEET_SCOPES],
  };
};

export const validateGoogleMeetOAuthConfig = (config: GoogleMeetOAuthConfig): void => {
  if (config.stubMode) {
    return;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required when GOOGLE_MEET_STUB_MODE is false',
    );
  }

  if (config.scopes.length === 0) {
    throw new Error('Google Meet OAuth config requires at least one OAuth scope');
  }
};
