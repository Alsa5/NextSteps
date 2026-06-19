export interface AppNotification {
  id: string;
  recipientEmail: string;
  role: 'ld' | 'trainer' | 'maverick' | 'all';
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationRepository {
  create(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): Promise<AppNotification>;
  listForRecipient(email: string, role: string): Promise<AppNotification[]>;
  markRead(id: string, recipientEmail: string): Promise<boolean>;
}

let notifications: AppNotification[] = [];

export const createNotificationRepository = (): NotificationRepository => ({
  async create(input) {
    const note: AppNotification = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...input,
    };
    notifications = [note, ...notifications].slice(0, 200);
    return note;
  },

  async listForRecipient(email, role) {
    const normalized = email.toLowerCase();
    return notifications.filter(
      (n) =>
        n.recipientEmail.toLowerCase() === normalized ||
        n.role === role ||
        n.role === 'all',
    );
  },

  async markRead(id, recipientEmail) {
    const idx = notifications.findIndex(
      (n) => n.id === id && n.recipientEmail.toLowerCase() === recipientEmail.toLowerCase(),
    );
    if (idx < 0) return false;
    notifications[idx] = { ...notifications[idx], read: true };
    return true;
  },
});
