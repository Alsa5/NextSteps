import { Collection, type Db, ObjectId } from 'mongodb';
import type { TranscriptDocument } from '../models/transcript.js';

export interface MongoTranscriptRecord {
  _id?: ObjectId;
  sessionId: string;
  rawTextRef: string;
  summary: string[];
  keyTerms: string[];
  confusionTimestamps: TranscriptDocument['confusionTimestamps'];
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptRepository {
  insert(doc: Omit<TranscriptDocument, 'id'>): Promise<TranscriptDocument>;
}

export interface SessionRepository {
  exists(sessionId: string): Promise<boolean>;
}

export const createSessionRepository = (db: Db): SessionRepository => ({
  async exists(sessionId: string): Promise<boolean> {
    const session = await db.collection('sessions').findOne({
      $or: [{ id: sessionId }, { sessionId }],
    });
    return session !== null;
  },
});

export const createTranscriptRepository = (db: Db): TranscriptRepository => {
  const collection: Collection<MongoTranscriptRecord> = db.collection('transcripts');

  return {
    async insert(doc: Omit<TranscriptDocument, 'id'>): Promise<TranscriptDocument> {
      const record: MongoTranscriptRecord = {
        sessionId: doc.sessionId,
        rawTextRef: doc.rawTextRef,
        summary: doc.summary,
        keyTerms: doc.keyTerms,
        confusionTimestamps: doc.confusionTimestamps,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };

      const result = await collection.insertOne(record);

      return {
        id: result.insertedId.toHexString(),
        ...doc,
      };
    },
  };
};
