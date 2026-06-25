let notifications = [];
export const createNotificationRepository = () => ({
    async create(input) {
        const note = {
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
        return notifications.filter((n) => n.recipientEmail.toLowerCase() === normalized ||
            n.role === role ||
            n.role === 'all');
    },
    async markRead(id, recipientEmail) {
        const idx = notifications.findIndex((n) => n.id === id && n.recipientEmail.toLowerCase() === recipientEmail.toLowerCase());
        if (idx < 0)
            return false;
        notifications[idx] = { ...notifications[idx], read: true };
        return true;
    },
});
