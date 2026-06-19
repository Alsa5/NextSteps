import { Router } from 'express';
import type { NotificationRepository } from '../repositories/notification-repository.js';

export interface NotificationsRouterDeps {
  notifications: NotificationRepository;
}

export const createNotificationsRouter = (deps: NotificationsRouterDeps): Router => {
  const router = Router();

  router.get('/notifications', async (req, res) => {
    const email = req.authUser!.email;
    const role = req.authUser!.role;
    const items = await deps.notifications.listForRecipient(email, role);
    res.json({ notifications: items });
  });

  router.post('/notifications/:id/read', async (req, res) => {
    const ok = await deps.notifications.markRead(String(req.params.id), req.authUser!.email);
    if (!ok) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ ok: true });
  });

  return router;
};
