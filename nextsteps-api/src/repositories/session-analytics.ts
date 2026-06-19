import type { SessionRecord, TranscriptRecord } from '../types/analytics.js';

export interface SessionAnalyticsRepository {
  getSession(sessionId: string): Promise<SessionRecord | null>;
  getTranscript(sessionId: string): Promise<TranscriptRecord | null>;
  isMaverickInSessionBatch(maverickId: string, sessionId: string): Promise<boolean>;
  isTrainerForSession(trainerId: string, sessionId: string): Promise<boolean>;
}
