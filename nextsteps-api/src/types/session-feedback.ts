import type { UserRole } from './auth.js';

export type MoodType = 'great' | 'good' | 'okay' | 'confused';

export interface SessionFeedbackSubmission {
  _id: string;
  sessionId: string;
  batchId: string;
  trainerEmail: string;
  maverickId: string;
  maverickName: string; // Stored but never returned to trainer endpoints
  mood: MoodType;
  clarity: number; // 1-5
  pace: number; // 1-5
  openText?: string;
  submittedAt: string;
}

// Trainer-facing sanitized response (no individual identity)
export interface SanitizedSessionFeedback {
  sessionId: string;
  batchId: string;
  trainerEmail: string;
  aggregateStats: {
    totalResponses: number;
    moodDistribution: Record<MoodType, number>;
    averageClarity: number;
    averagePace: number;
    responseRate?: number; // If batch size is known
  };
  comments: string[]; // Just the text, no attribution
  privacy: 'trainer-aggregate-only';
  kAnonymityApplied: boolean;
  lowSampleSize?: boolean;
}

// L&D-facing detailed response (with individual identity)
export interface DetailedSessionFeedback {
  sessionId: string;
  batchId: string;
  trainerEmail: string;
  aggregateStats: {
    totalResponses: number;
    moodDistribution: Record<MoodType, number>;
    averageClarity: number;
    averagePace: number;
    responseRate?: number;
  };
  individualResponses: Array<{
    maverickId: string;
    maverickName: string;
    mood: MoodType;
    clarity: number;
    pace: number;
    openText?: string;
    submittedAt: string;
  }>;
  privacy: 'ld-full-detail';
}