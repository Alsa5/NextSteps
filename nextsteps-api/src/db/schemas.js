import { z } from 'zod';
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
export const roleMappingSchema = z.object({
    _id: z.string().uuid(),
    type: z.enum(['email', 'designation']),
    value: z.string().min(1),
    role: userRoleSchema,
    keywords: z.array(z.string()).optional(),
    createdAt: z.string().datetime(),
});
