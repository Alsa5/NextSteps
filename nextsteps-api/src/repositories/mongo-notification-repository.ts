import { randomUUID } from 'crypto';
import type { Collection } from 'mongodb';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { AppNotification, NotificationRepository } from './notification-repository.js';

const MAX_PER_RECIPIENT = 200;

export const createMongoNotificationRepository = (): NotificationRepository => {
  const collection = (): Collection<AppNotification> =>
    getDb().collection<AppNotification>(NEXTSTEPS_COLLECTIONS.NOTIFICATIONS);

  return {
    async create(input) {
      const note: AppNotification = {
        id: randomUUID(),
        read: false,
        createdAt: new Date().toISOString(),
        ...input,
        recipientEmail: input.recipientEmail.toLowerCase(),
      };

      await collection().insertOne(note);

      const recipientCount = await collection().countDocuments({
        recipientEmail: note.recipientEmail,
      });
      if (recipientCount > MAX_PER_RECIPIENT) {
        const overflow = await collection()
          .find({ recipientEmail: note.recipientEmail })
          .sort({ createdAt: 1 })
          .limit(recipientCount - MAX_PER_RECIPIENT)
          .toArray();
        const ids = overflow.map((n) => n.id);
        if (ids.length > 0) {
          await collection().deleteMany({ id: { $in: ids } });
        }
      }

      return note;
    },

    async listForRecipient(email, role) {
      const normalized = email.toLowerCase();
      const roleFilter = role as AppNotification['role'];
      return collection()
        .find({
          $or: [
            { recipientEmail: normalized },
            { role: roleFilter },
            { role: 'all' },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(MAX_PER_RECIPIENT)
        .toArray();
    },

    async markRead(id, recipientEmail) {
      const result = await collection().updateOne(
        { id, recipientEmail: recipientEmail.toLowerCase() },
        { $set: { read: true } },
      );
      return result.modifiedCount > 0;
    },
  };
};
