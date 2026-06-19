import { Router } from 'express';
import type { RoleMappingRepository } from '../repositories/role-mapping-repository.js';
import type { UserRepository } from '../repositories/user-repository.js';
import type { UserRole } from '../types/auth.js';
import { z } from 'zod';

const emailMappingSchema = z.object({
  email: z.string().email(),
  role: z.enum(['maverick', 'trainer', 'ld', 'manager']),
});

const designationMappingSchema = z.object({
  value: z.string().min(1),
  role: z.enum(['maverick', 'trainer', 'ld', 'manager']),
  keywords: z.array(z.string()).optional(),
});

export interface RoleAdminRouterDeps {
  users: UserRepository;
  roleMappings: RoleMappingRepository;
  requireAdmin?: (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void;
}

export const createRoleAdminRouter = (deps: RoleAdminRouterDeps): Router => {
  const router = Router();

  router.get('/mappings', async (_req, res) => {
    const mappings = await deps.roleMappings.findAll();
    res.status(200).json(mappings);
  });

  router.post('/mappings/email', async (req, res) => {
    const parsed = emailMappingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await deps.roleMappings.seedDefaults([
      {
        type: 'email',
        value: parsed.data.email.toLowerCase(),
        role: parsed.data.role as UserRole,
      },
    ]);

    res.status(201).json({ status: 'created' });
  });

  router.post('/mappings/designation', async (req, res) => {
    const parsed = designationMappingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    await deps.roleMappings.seedDefaults([
      {
        type: 'designation',
        value: parsed.data.value,
        role: parsed.data.role as UserRole,
        keywords: parsed.data.keywords,
      },
    ]);

    res.status(201).json({ status: 'created' });
  });

  router.patch('/users/:email/role', async (req, res) => {
    const email = req.params.email;
    const role = req.body?.role as UserRole | undefined;

    if (!role || !['maverick', 'trainer', 'ld', 'manager'].includes(role)) {
      res.status(400).json({ error: 'Valid role is required' });
      return;
    }

    const user = await deps.users.updateRole(email, role);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      name: user.fullName,
      role: user.role,
    });
  });

  return router;
};
