import type { AnalyzeSessionSentimentPayload } from '../../models/queue-names.js';
import type { SessionStore } from '../../repositories/session-store.js';
import { runSessionTranscriptPipeline } from '../../services/session-pipeline.js';

export interface AnalyzeSessionSentimentDeps {
  sessions: SessionStore;
}

export const createAnalyzeSessionSentimentHandler =
  (deps: AnalyzeSessionSentimentDeps) =>
  async (payload: AnalyzeSessionSentimentPayload): Promise<{ sessionId: string }> => {
    await runSessionTranscriptPipeline(deps.sessions, payload.sessionId);
    return { sessionId: payload.sessionId };
  };
