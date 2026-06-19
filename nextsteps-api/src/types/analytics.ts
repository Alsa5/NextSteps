export interface ConfusionTimestamp {
  time: string;
  topic: string;
  clarityDip: number;
}

export interface SessionAiAnalysis {
  summary: string[];
  keyTerms: string[];
  confusionPoints: string[];
  clarityScore: number | null;
  paceRating: string | null;
  recommendations: string[];
  trainerInsights: string;
  generatedAt: string;
  model: string;
}

export interface SessionRecord {
  id: string;
  title: string;
  batchId: string;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  meetLink: string;
  meetCode: string;
  scheduledAt: string;
  status: 'scheduled' | 'live' | 'completed';
  sessionType: 'pre-onboarding' | 'training';
  avgClarity: number;
  avgPace: number;
  moodDistribution: Record<string, number>;
  feedbackCompletion: number;
  attendanceRate: number;
  audienceEmails: string[];
  createdAt: string;
}

export interface TranscriptRecord {
  sessionId: string;
  summary: string[];
  keyTerms: string[];
  confusionTimestamps: ConfusionTimestamp[];
  rawText?: string;
  segments?: Array<{ speaker: string; text: string; startTime: string }>;
  aiAnalysis?: SessionAiAnalysis | null;
}

export interface TrainerSessionAnalyticsResponse {
  sessionId: string;
  title?: string;
  meetLink?: string;
  clarity: { avg: number };
  pace: { avg: number };
  mood: { distribution: Record<string, number> };
  feedbackCompletion: number;
  attendanceRate: number;
  confusionSpikes: ConfusionTimestamp[];
  keyTerms: string[];
  aiAnalysis?: SessionAiAnalysis | null;
  privacy: 'batch-aggregate-only';
}

export interface MaverickTranscriptSummaryResponse {
  sessionId: string;
  title?: string;
  summary: string[];
  keyTerms: string[];
  aiAnalysis?: SessionAiAnalysis | null;
}
