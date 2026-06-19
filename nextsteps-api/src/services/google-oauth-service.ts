import jwt from 'jsonwebtoken';
import {
  loadGoogleMeetOAuthConfig,
  type GoogleMeetOAuthConfig,
} from '../integrations/google-meet/oauth-config.js';
import type { GoogleOAuthTokenRepository } from '../repositories/google-oauth-token-repository.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface GoogleOAuthState {
  purpose: 'google-oauth';
  sub: string;
  email: string;
}

const getConfig = (): GoogleMeetOAuthConfig => loadGoogleMeetOAuthConfig();

export const signOAuthState = (jwtSecret: string, userId: string, email: string): string =>
  jwt.sign({ purpose: 'google-oauth', sub: userId, email } satisfies GoogleOAuthState, jwtSecret, {
    expiresIn: '15m',
  });

export const verifyOAuthState = (jwtSecret: string, state: string): GoogleOAuthState => {
  const payload = jwt.verify(state, jwtSecret) as GoogleOAuthState & { sub: string };
  if (payload.purpose !== 'google-oauth') {
    throw new Error('Invalid OAuth state');
  }
  return payload;
};

export const buildGoogleAuthorizationUrl = (jwtSecret: string, userId: string, email: string): string => {
  const config = getConfig();
  const state = signOAuthState(jwtSecret, userId, email);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: config.scopes.join(' '),
    state,
  });
  if (config.workspaceDomain) {
    params.set('hd', config.workspaceDomain);
  }
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
};

const postTokenRequest = async (body: Record<string, string>): Promise<GoogleTokenResponse> => {
  const config = getConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...body,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Google token exchange failed: ${errText}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
};

export const exchangeAuthorizationCode = async (code: string): Promise<GoogleTokenResponse> => {
  const config = getConfig();
  return postTokenRequest({
    code,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });
};

export const refreshGoogleAccessToken = async (refreshToken: string): Promise<GoogleTokenResponse> =>
  postTokenRequest({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

export const saveTokensForUser = async (
  repo: GoogleOAuthTokenRepository,
  userId: string,
  email: string,
  tokens: GoogleTokenResponse,
  existingRefresh?: string,
): Promise<void> => {
  const refreshToken = tokens.refresh_token ?? existingRefresh;
  if (!refreshToken) {
    throw new Error('Google did not return a refresh token. Revoke app access and reconnect.');
  }

  await repo.upsert({
    userId,
    email,
    refreshToken,
    scopes: tokens.scope.split(' ').filter(Boolean),
    updatedAt: new Date(),
  });
};

export const getValidAccessToken = async (
  repo: GoogleOAuthTokenRepository,
  userId: string,
): Promise<{ accessToken: string; email: string }> => {
  const record = await repo.findByUserId(userId);
  if (!record) {
    throw new Error('Google Calendar not connected. Connect your Google account first.');
  }

  const tokens = await refreshGoogleAccessToken(record.refreshToken);
  if (tokens.refresh_token) {
    await saveTokensForUser(repo, userId, record.email, tokens, record.refreshToken);
  }

  return { accessToken: tokens.access_token, email: record.email };
};
