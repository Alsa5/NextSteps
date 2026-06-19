export type UserRole = 'maverick' | 'trainer' | 'ld' | 'manager';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
