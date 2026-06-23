import type { Collection } from 'mongodb';
import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { SessionRecord, TranscriptRecord } from '../types/analytics.js';
import type { CreateSessionInput, SessionStore } from './session-store.js';

interface MaverickBatchMembership {
  maverickId: string;
  batchId: string;
}

const sessionsCol = (): Collection<SessionRecord> =>
  getDb().collection<SessionRecord>(NEXTSTEPS_COLLECTIONS.SESSIONS);

const transcriptsCol = (): Collection<TranscriptRecord & { sessionId: string }> =>
  getDb().collection(NEXTSTEPS_COLLECTIONS.SESSION_TRANSCRIPTS);

const membershipsCol = (): Collection<MaverickBatchMembership> =>
  getDb().collection<MaverickBatchMembership>(NEXTSTEPS_COLLECTIONS.MAVERICK_BATCH_MEMBERSHIPS);

const nextSessionId = async (): Promise<string> => {
  const latest = await sessionsCol()
    .find({ id: /^ses-\d+$/ })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  if (latest.length === 0) {
    return 'ses-001';
  }

  const match = latest[0].id.match(/^ses-(\d+)$/);
  const n = match ? Number(match[1]) + 1 : 1;
  return `ses-${String(n).padStart(3, '0')}`;
};

export const createMongoSessionStore = (): SessionStore => ({
  async listSessions(filters = {}) {
    const query: Record<string, string> = {};
    if (filters.batchId) query.batchId = filters.batchId;
    if (filters.trainerId) query.trainerId = filters.trainerId;
    if (filters.status) query.status = filters.status;
    return sessionsCol().find(query).sort({ scheduledAt: -1 }).toArray();
  },

  async createSession(input) {
    const session: SessionRecord = {
      id: await nextSessionId(),
      title: input.title,
      batchId: input.batchId,
      trainerId: input.trainerId,
      trainerName: input.trainerName,
      trainerEmail: input.trainerEmail,
      meetLink: input.meetLink,
      meetCode: input.meetCode,
      scheduledAt: input.scheduledAt,
      status: 'scheduled',
      sessionType: input.sessionType,
      avgClarity: 0,
      avgPace: 0,
      moodDistribution: { great: 0, good: 0, okay: 0, confused: 0 },
      feedbackCompletion: 0,
      attendanceRate: 0,
      audienceEmails: input.audienceEmails,
      createdAt: new Date().toISOString(),
    };

    await sessionsCol().insertOne(session);
    return session;
  },

  async updateSessionStatus(sessionId, status) {
    const result = await sessionsCol().findOneAndUpdate(
      { id: sessionId },
      { $set: { status } },
      { returnDocument: 'after' },
    );
    return result ?? null;
  },

  async updateSessionMetrics(sessionId, metrics) {
    const result = await sessionsCol().findOneAndUpdate(
      { id: sessionId },
      { $set: metrics },
      { returnDocument: 'after' },
    );
    return result ?? null;
  },

  async getSession(sessionId) {
    return sessionsCol().findOne({ id: sessionId });
  },

  async getTranscript(sessionId) {
    const doc = await transcriptsCol().findOne({ sessionId });
    if (!doc) {
      return null;
    }
    return {
      sessionId: doc.sessionId,
      summary: doc.summary,
      keyTerms: doc.keyTerms,
      confusionTimestamps: doc.confusionTimestamps,
      rawText: doc.rawText,
      segments: doc.segments,
      aiAnalysis: doc.aiAnalysis,
    };
  },

  async upsertTranscript(transcript) {
    await transcriptsCol().updateOne(
      { sessionId: transcript.sessionId },
      { $set: { ...transcript, sessionId: transcript.sessionId } },
      { upsert: true },
    );
    return transcript;
  },

  async getSessionsByAudienceEmail(email) {
    const normalized = email.toLowerCase();
    return sessionsCol()
      .find({
        $or: [
          { audienceEmails: normalized },
          { trainerEmail: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        ],
      })
      .sort({ scheduledAt: -1 })
      .toArray();
  },

  async isMaverickInSessionBatch(maverickId, sessionId) {
    const session = await sessionsCol().findOne({ id: sessionId });
    if (!session) {
      return false;
    }

    const membership = await membershipsCol().findOne({ maverickId });
    return membership?.batchId === session.batchId;
  },

  async isTrainerForSession(trainerId, sessionId) {
    const session = await sessionsCol().findOne({ id: sessionId });
    return session?.trainerId === trainerId;
  },
});

export const registerAudienceBatch = async (email: string, batchId: string): Promise<void> => {
  await sessionsCol().updateMany(
    { audienceEmails: email.toLowerCase() },
    { $set: { batchId } },
  );
};

export const registerMaverickBatch = async (maverickId: string, batchId: string): Promise<void> => {
  await membershipsCol().updateOne(
    { maverickId },
    { $set: { maverickId, batchId } },
    { upsert: true },
  );
};
