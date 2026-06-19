import { Router } from 'express';
import { requireRoles } from '../middleware/auth.js';
import type { GoogleOAuthTokenRepository } from '../repositories/google-oauth-token-repository.js';
import {
  buildGoogleAuthorizationUrl,
  exchangeAuthorizationCode,
  saveTokensForUser,
  verifyOAuthState,
} from '../services/google-oauth-service.js';
import { loadGoogleMeetOAuthConfig } from '../integrations/google-meet/oauth-config.js';

export interface GoogleOAuthRouterDeps {
  googleTokens: GoogleOAuthTokenRepository;
  jwtSecret: string;
  corsOrigin: string;
}

export const createGoogleOAuthCallbackRouter = (deps: GoogleOAuthRouterDeps): Router => {
  const router = Router();

  router.get('/integrations/google/oauth/callback', async (req, res) => {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';

    const redirectBase = `${deps.corsOrigin}/pre-onboarding-sessions`;

    if (oauthError) {
      res.redirect(`${redirectBase}?google=error&message=${encodeURIComponent(oauthError)}`);
      return;
    }

    if (!code || !state) {
      res.redirect(`${redirectBase}?google=error&message=missing_code`);
      return;
    }

    try {
      const payload = verifyOAuthState(deps.jwtSecret, state);
      const tokens = await exchangeAuthorizationCode(code);
      await saveTokensForUser(deps.googleTokens, payload.sub, payload.email, tokens);

      res.redirect(`${redirectBase}?google=connected`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'oauth_failed';
      res.redirect(`${redirectBase}?google=error&message=${encodeURIComponent(message)}`);
    }
  });

  return router;
};

export const createGoogleOAuthRouter = (deps: GoogleOAuthRouterDeps): Router => {
  const router = Router();

  router.get('/integrations/google/oauth/status', requireRoles('ld'), async (req, res) => {
    const config = loadGoogleMeetOAuthConfig();
    const record = await deps.googleTokens.findByUserId(req.authUser!.id);

    res.json({
      connected: Boolean(record?.refreshToken),
      email: record?.email ?? null,
      stubMode: config.stubMode,
      scopes: record?.scopes ?? config.scopes,
    });
  });

  router.get('/integrations/google/oauth/start-url', requireRoles('ld'), (req, res) => {
    const config = loadGoogleMeetOAuthConfig();
    if (config.stubMode) {
      res.status(400).json({
        error: 'Google OAuth is in stub mode. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_MEET_STUB_MODE=false.',
      });
      return;
    }

    const url = buildGoogleAuthorizationUrl(
      deps.jwtSecret,
      req.authUser!.id,
      req.authUser!.email,
    );
    res.json({ url });
  });

  router.delete('/integrations/google/oauth/disconnect', requireRoles('ld'), async (req, res) => {
    await deps.googleTokens.deleteByUserId(req.authUser!.id);
    res.json({ ok: true });
  });

  return router;
};
