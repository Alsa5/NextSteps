import type { MeetTranscriptPayload } from '../clients/google-meet-client.js';
import type { ConfusionTimestamp } from '../models/transcript.js';

const CONFUSION_KEYWORDS = ['confusion', 'confused', 'unclear', 'question', '?'];

const extractTopic = (text: string): string => {
  const cleaned = text.replace(/\?/g, '').trim();
  if (cleaned.length <= 80) {
    return cleaned;
  }

  return `${cleaned.slice(0, 77)}...`;
};

export const buildSummary = (payload: MeetTranscriptPayload): string[] => {
  return payload.segments
    .map((segment) => segment.text.trim())
    .filter((line) => line.length > 0)
    .slice(0, 8);
};

export const extractKeyTerms = (payload: MeetTranscriptPayload): string[] => {
  const terms = new Set<string>();

  for (const segment of payload.segments) {
    const matches = segment.text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) ?? [];
    for (const match of matches) {
      if (match.split(' ').length <= 3) {
        terms.add(match);
      }
    }
  }

  return [...terms].slice(0, 6);
};

export const detectConfusionTimestamps = (
  payload: MeetTranscriptPayload,
): ConfusionTimestamp[] => {
  return payload.segments
    .filter((segment) => {
      const lower = segment.text.toLowerCase();
      return CONFUSION_KEYWORDS.some((keyword) => lower.includes(keyword));
    })
    .map((segment, index) => ({
      time: segment.startOffset,
      topic: extractTopic(segment.text),
      clarityDip: Number((2.5 + index * 0.3).toFixed(1)),
    }));
};

export const buildRawTextRef = (sessionId: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `transcripts/${sessionId}/${timestamp}.txt`;
};
