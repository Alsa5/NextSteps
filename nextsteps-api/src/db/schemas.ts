import { z } from 'zod';
import type { UserRole } from '../types/auth.js';

export const userRoleSchema = z.enum(['maverick', 'trainer', 'ld', 'manager']);

export const nextstepsUserSchema = z.object({
  _id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  role: userRoleSchema,
  jobTitle: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  hexId: z.string().optional(),
  authProvider: z.enum(['azure', 'email']).default('azure'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type NextStepsUser = z.infer<typeof nextstepsUserSchema>;

export const roleMappingSchema = z.object({
  _id: z.string().uuid(),
  type: z.enum(['email', 'designation']),
  value: z.string().min(1),
  role: userRoleSchema,
  keywords: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
});

export type RoleMapping = z.infer<typeof roleMappingSchema>;

export type InsertNextStepsUser = Omit<NextStepsUser, '_id' | 'createdAt' | 'updatedAt'>;
export type InsertRoleMapping = Omit<RoleMapping, '_id' | 'createdAt'>;
