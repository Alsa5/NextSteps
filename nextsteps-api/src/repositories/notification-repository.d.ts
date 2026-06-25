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
export declare const createNotificationRepository: () => NotificationRepository;
