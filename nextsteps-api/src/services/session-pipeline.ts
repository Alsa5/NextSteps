import type { SessionStore } from '../repositories/session-store.js';
import type { TranscriptRecord } from '../types/analytics.js';
import { analyzeTranscriptWithGpt } from './transcript-analysis-service.js';
import {
  buildSummary,
  detectConfusionTimestamps,
  extractKeyTerms,
} from '../worker/services/transcript-processor.js';
import type { MeetTranscriptPayload } from '../worker/clients/google-meet-client.js';

const STUB_TRANSCRIPT_SEGMENTS = [
  {
    text: 'Welcome everyone to the pre-onboarding orientation session.',
    startOffset: '00:01',
    endOffset: '00:15',
  },
  {
    text: 'Today we will cover platform access, batch expectations, and your first-week schedule.',
    startOffset: '00:16',
    endOffset: '00:45',
  },
  {
    text: 'Please use the chat if anything is unclear about joining instructions.',
    startOffset: '00:46',
    endOffset: '01:05',
  },
  {
    text: 'We will assign mentors and share the training universe roadmap after this call.',
    startOffset: '01:06',
    endOffset: '01:30',
  },
];

export const buildStubMeetPayload = (sessionTitle: string): MeetTranscriptPayload => {
  const segments = STUB_TRANSCRIPT_SEGMENTS.map((s) => ({
    startOffset: s.startOffset,
    text: s.text.replace(
      'orientation',
      sessionTitle.toLowerCase().includes('onboard') ? 'orientation' : 'session',
    ),
  }));
  return {
    rawText: segments.map((s) => `Trainer: ${s.text}`).join('\n'),
    segments,
  };
};

export const segmentsToRawText = (payload: MeetTranscriptPayload): string =>
  payload.segments.map((s) => `Trainer: ${s.text}`).join('\n');

export interface SessionPipelineResult {
  sessionId: string;
  transcript: TranscriptRecord;
}

export const runSessionTranscriptPipeline = async (
  store: SessionStore,
  sessionId: string,
): Promise<SessionPipelineResult> => {
  const session = await store.getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const meetPayload = buildStubMeetPayload(session.title);
  const rawText = segmentsToRawText(meetPayload);

  const aiAnalysis = await analyzeTranscriptWithGpt(rawText, session.title);

  const confusionTimestamps = detectConfusionTimestamps(meetPayload);
  const summary = aiAnalysis.summary.length > 0 ? aiAnalysis.summary : buildSummary(meetPayload);
  const keyTerms = aiAnalysis.keyTerms.length > 0 ? aiAnalysis.keyTerms : extractKeyTerms(meetPayload);

  const transcript: TranscriptRecord = {
    sessionId,
    summary,
    keyTerms,
    confusionTimestamps:
      confusionTimestamps.length > 0
        ? confusionTimestamps
        : aiAnalysis.confusionPoints.map((topic, i) => ({
            time: `${10 + i * 5}:00`,
            topic,
            clarityDip: 2.5 + i * 0.3,
          })),
    rawText,
    segments: meetPayload.segments.map((s) => ({
      speaker: 'Trainer',
      text: s.text,
      startTime: s.startOffset,
    })),
    aiAnalysis,
  };

  await store.upsertTranscript(transcript);

  await store.updateSessionStatus(sessionId, 'completed');

  const clarity = aiAnalysis.clarityScore ?? 80;
  await store.updateSessionMetrics(sessionId, {
    avgClarity: clarity / 20,
    avgPace: aiAnalysis.paceRating === 'Too Fast' ? 4.5 : aiAnalysis.paceRating === 'Too Slow' ? 2.5 : 3.8,
    feedbackCompletion: 0,
    attendanceRate: 85,
  });

  return { sessionId, transcript };
};
