import type { MeetTranscriptPayload } from '../clients/google-meet-client.js';
import type {
  AnalyzeSessionSentimentPayload,
  IngestMeetTranscriptPayload,
} from '../../models/queue-names.js';
import type { TranscriptDocument } from '../models/transcript.js';
import {
  buildRawTextRef,
  buildSummary,
  detectConfusionTimestamps,
  extractKeyTerms,
} from '../services/transcript-processor.js';

export interface IngestMeetTranscriptDeps {
  sessionExists(sessionId: string): Promise<boolean>;
  fetchTranscript(
    sessionId: string,
    meetConferenceId?: string,
  ): Promise<MeetTranscriptPayload>;
  persistTranscript(doc: Omit<TranscriptDocument, 'id'>): Promise<TranscriptDocument>;
  enqueueAnalyzeSessionSentiment(payload: AnalyzeSessionSentimentPayload): Promise<void>;
}

export interface IngestMeetTranscriptResult {
  sessionId: string;
  transcriptId: string;
}

export const createIngestMeetTranscriptHandler =
  (deps: IngestMeetTranscriptDeps) =>
  async (payload: IngestMeetTranscriptPayload): Promise<IngestMeetTranscriptResult> => {
    const { sessionId, meetConferenceId } = payload;

    const exists = await deps.sessionExists(sessionId);
    if (!exists) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const meetPayload = await deps.fetchTranscript(sessionId, meetConferenceId);
    const now = new Date();

    const saved = await deps.persistTranscript({
      sessionId,
      rawTextRef: buildRawTextRef(sessionId),
      summary: buildSummary(meetPayload),
      keyTerms: extractKeyTerms(meetPayload),
      confusionTimestamps: detectConfusionTimestamps(meetPayload),
      createdAt: now,
      updatedAt: now,
    });

    await deps.enqueueAnalyzeSessionSentiment({
      sessionId,
      transcriptId: saved.id,
    });

    return {
      sessionId,
      transcriptId: saved.id,
    };
  };
