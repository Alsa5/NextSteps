import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser, UserRole } from '../types/auth.js';

interface JwtClaims {
  sub: string;
  role: UserRole;
  email: string;
}

const PUBLIC_PATHS = [
  '/api/v1/health',
  '/api/v1/auth/sso',
];

const isPublicPath = (path: string): boolean =>
  PUBLIC_PATHS.some((endpoint) => path === endpoint || path.startsWith(`${endpoint}/`));

export const createAuthMiddleware = (jwtSecret: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isPublicPath(req.path)) {
      next();
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization required' });
      return;
    }

    const token = header.slice('Bearer '.length).trim();

    try {
      const claims = jwt.verify(token, jwtSecret) as JwtClaims;
      req.authUser = { id: claims.sub, role: claims.role, email: claims.email ?? '' };
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

export const requireRoles =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authorization required' });
      return;
    }

    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Insufficient role permissions' });
      return;
    }

    next();
  };

export const signAccessToken = (
  jwtSecret: string,
  user: AuthUser,
): string => jwt.sign({ sub: user.id, role: user.role, email: user.email }, jwtSecret, { expiresIn: '1h' });
