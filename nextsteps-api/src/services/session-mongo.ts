import { getDb } from '../db/mongo.js';
import type { SessionRecord } from '../types/analytics.js';

export const persistSessionToMongo = async (session: SessionRecord): Promise<void> => {
  try {
    const db = getDb();
    await db.collection('sessions').updateOne(
      { id: session.id },
      {
        $set: {
          id: session.id,
          sessionId: session.id,
          batchId: session.batchId,
          trainerId: session.trainerId,
          title: session.title,
          meetLink: session.meetLink,
          status: session.status,
        },
      },
      { upsert: true },
    );
  } catch {
    /* Mongo optional in some dev setups */
  }
};

export const sessionExistsInMongo = async (sessionId: string): Promise<boolean> => {
  try {
    const db = getDb();
    const session = await db.collection('sessions').findOne({
      $or: [{ id: sessionId }, { sessionId }],
    });
    return session !== null;
  } catch {
    return false;
  }
};
