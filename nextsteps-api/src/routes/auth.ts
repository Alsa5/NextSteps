import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { signAccessToken, createAuthMiddleware } from '../middleware/auth.js';
import type { RoleMappingRepository } from '../repositories/role-mapping-repository.js';
import type { TraineeRegistryRepository } from '../repositories/trainee-registry-repository.js';
import type { UserRepository } from '../repositories/user-repository.js';
import { fetchGraphProfile, getEmailFromProfile } from '../services/azure-graph.js';
import { resolveUserRole } from '../services/role-resolver.js';
import { isAppAdmin } from '../services/app-admin.js';
import {
  assertPersonalEmailSignIn,
  assertSsoSignIn,
  consumeMagicLinkToken,
  consumeOtp,
  createMagicLinkWithOtp,
  purgeExpiredMagicLinks,
} from '../services/email-auth.js';
import { sendAuthEmail } from '../services/mail-service.js';
import { resolvePersonalEmailUser } from '../services/personal-email-auth.js';
import { env } from '../config/env.js';
import type { UserRole } from '../types/auth.js';

const magicLinkRequestSchema = z.object({
  email: z.string().email(),
});

const magicLinkVerifySchema = z.object({
  token: z.string().min(16),
});

const magicLinkOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
});

const switchRoleSchema = z.object({
  role: z.enum(['maverick', 'trainer', 'ld', 'manager']),
});

const ssoBodySchema = z.object({
  designation: z.string().optional(),
}).optional();

export interface AuthRouterDeps {
  jwtSecret: string;
  users: UserRepository;
  roleMappings: RoleMappingRepository;
  traineeRegistry: TraineeRegistryRepository;
}

const toPublicUser = (user: {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  jobTitle?: string;
  designation?: string;
  hexId?: string;
}) => ({
  id: user._id,
  email: user.email,
  name: user.fullName,
  role: user.role,
  jobTitle: user.jobTitle,
  designation: user.designation,
  hexId: user.hexId,
  isAppAdmin: isAppAdmin(user.email),
});

export const createAuthRouter = (deps: AuthRouterDeps): Router => {
  const router = Router();
  const requireAppJwt = createAuthMiddleware(deps.jwtSecret);

  router.post('/sso', async (req: Request, res: Response) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Azure access token required' });
      return;
    }

    const azureToken = header.slice('Bearer '.length).trim();
    const body = ssoBodySchema.parse(req.body);

    try {
      const profile = await fetchGraphProfile(azureToken);
      const email = getEmailFromProfile(profile);

      if (!email) {
        res.status(400).json({ error: 'Unable to resolve email from Azure profile' });
        return;
      }

      const jobTitle = profile.jobTitle?.trim();
      const designation = body?.designation?.trim() || jobTitle;
      const department = profile.department?.trim();

      const existing = await deps.users.findByEmail(email);
      const role =
        existing && isAppAdmin(email)
          ? existing.role
          : await resolveUserRole(
              { email, jobTitle, designation, department },
              deps.roleMappings,
            );

      const user = await deps.users.upsertUser(email, {
        fullName: profile.displayName || email,
        role,
        jobTitle,
        designation,
        department,
        authProvider: 'azure',
      });

      // App admins may demo any role via switch-role; do not block corporate re-login.
      if (!isAppAdmin(email)) {
        assertSsoSignIn(user);
      }

      const token = signAccessToken(deps.jwtSecret, { id: user._id, role: user.role, email: user.email });

      res.status(200).json({
        token,
        user: toPublicUser(user),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SSO authentication failed';
      res.status(401).json({ error: message });
    }
  });

  router.post('/magic-link/request', async (req: Request, res: Response) => {
    const parsed = magicLinkRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    purgeExpiredMagicLinks();

    const email = parsed.data.email.trim().toLowerCase();

    try {
      const user = await resolvePersonalEmailUser(email, deps.users, deps.traineeRegistry);
      assertPersonalEmailSignIn(user, email);
      const { token, otp, expiresAt } = createMagicLinkWithOtp(user);

      const magicLinkUrl = `${env.AppPublicUrl.replace(/\/$/, '')}/auth/email?token=${token}`;
      const delivery = await sendAuthEmail({
        to: user.email,
        fullName: user.fullName,
        magicLinkUrl,
        otp,
        expiresMinutes: 15,
      });

      const payload: Record<string, unknown> = {
        sent: true,
        email: user.email,
        expiresAt: new Date(expiresAt).toISOString(),
        delivery: delivery.channel,
        message: delivery.delivered
          ? 'Check your inbox for a magic link and 6-digit code — both expire in 15 minutes.'
          : delivery.error
            ? 'Email could not be sent from this network — use the 6-digit code shown below.'
            : 'Sign-in code ready. Enter the 6-digit OTP below (email delivery is not configured on this server).',
      };

      if (env.NodeEnv !== 'production' || !delivery.delivered) {
        payload.devVerifyPath = `/auth/email?token=${token}`;
        payload.devOtp = otp;
      }

      res.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send magic link';
      res.status(403).json({ error: message });
    }
  });

  router.post('/magic-link/verify', async (req: Request, res: Response) => {
    const parsed = magicLinkVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid token is required' });
      return;
    }

    purgeExpiredMagicLinks();

    try {
      const user = await consumeMagicLinkToken(parsed.data.token, deps.users);
      if (!user) {
        res.status(401).json({ error: 'Invalid or expired magic link' });
        return;
      }

      assertPersonalEmailSignIn(user, user.email);

      const updated = await deps.users.upsertUser(user.email, {
        fullName: user.fullName,
        role: user.role,
        jobTitle: user.jobTitle,
        designation: user.designation,
        department: user.department,
        authProvider: 'email',
      });

      const token = signAccessToken(deps.jwtSecret, { id: updated._id, role: updated.role, email: updated.email });

      res.status(200).json({
        token,
        user: toPublicUser(updated),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Magic link verification failed';
      res.status(403).json({ error: message });
    }
  });

  router.post('/magic-link/verify-otp', async (req: Request, res: Response) => {
    const parsed = magicLinkOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and 6-digit code are required' });
      return;
    }

    purgeExpiredMagicLinks();

    const email = parsed.data.email.trim().toLowerCase();
    const otp = parsed.data.otp.trim();

    try {
      const user = await consumeOtp(email, otp, deps.users);
      if (!user) {
        res.status(401).json({ error: 'Invalid or expired code' });
        return;
      }

      assertPersonalEmailSignIn(user, user.email);

      const updated = await deps.users.upsertUser(user.email, {
        fullName: user.fullName,
        role: user.role,
        jobTitle: user.jobTitle,
        designation: user.designation,
        department: user.department,
        authProvider: 'email',
      });

      const token = signAccessToken(deps.jwtSecret, { id: updated._id, role: updated.role, email: updated.email });

      res.status(200).json({
        token,
        user: toPublicUser(updated),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP verification failed';
      res.status(403).json({ error: message });
    }
  });

  router.get('/me', requireAppJwt, (req: Request, res: Response) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authorization required' });
      return;
    }

    deps.users
      .findById(req.authUser.id)
      .then((user) => {
        if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        res.status(200).json({
          ...toPublicUser(user),
          role: req.authUser!.role,
        });
      })
      .catch(() => {
        res.status(500).json({ error: 'Failed to load user profile' });
      });
  });

  router.post('/switch-role', requireAppJwt, async (req: Request, res: Response) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authorization required' });
      return;
    }

    const parsed = switchRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid role is required' });
      return;
    }

    try {
      const user = await deps.users.findById(req.authUser.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (!isAppAdmin(user.email)) {
        res.status(403).json({ error: 'Role switching is restricted to app administrators' });
        return;
      }

      const nextRole = parsed.data.role as UserRole;
      const updated = await deps.users.updateRole(user.email, nextRole);
      if (!updated) {
        res.status(500).json({ error: 'Failed to update role' });
        return;
      }

      const token = signAccessToken(deps.jwtSecret, { id: updated._id, role: nextRole, email: updated.email });

      res.status(200).json({
        token,
        user: { ...toPublicUser(updated), role: nextRole },
      });
    } catch {
      res.status(500).json({ error: 'Failed to switch role' });
    }
  });

  return router;
};
