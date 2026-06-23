import type { SessionRecord, TranscriptRecord } from '../types/analytics.js';

export interface SessionAnalyticsRepository {
  getSession(sessionId: string): Promise<SessionRecord | null>;
  getTranscript(sessionId: string): Promise<TranscriptRecord | null>;
  isMaverickInSessionBatch(maverickId: string, sessionId: string): Promise<boolean>;
  isTrainerForSession(trainerId: string, sessionId: string): Promise<boolean>;
}

export interface CreateSessionInput {
  title: string;
  batchId: string;
  trainerId: string;
  trainerName: string;
  trainerEmail: string;
  meetLink: string;
  meetCode: string;
  scheduledAt: string;
  sessionType: 'pre-onboarding' | 'training';
  audienceEmails: string[];
}

export interface SessionStore extends SessionAnalyticsRepository {
  listSessions(filters?: { batchId?: string; trainerId?: string; status?: string }): Promise<SessionRecord[]>;
  createSession(input: CreateSessionInput): Promise<SessionRecord>;
  updateSessionStatus(sessionId: string, status: SessionRecord['status']): Promise<SessionRecord | null>;
  updateSessionMetrics(
    sessionId: string,
    metrics: Partial<Pick<SessionRecord, 'avgClarity' | 'avgPace' | 'feedbackCompletion' | 'attendanceRate' | 'moodDistribution'>>,
  ): Promise<SessionRecord | null>;
  upsertTranscript(transcript: TranscriptRecord): Promise<TranscriptRecord>;
  getSessionsByAudienceEmail(email: string): Promise<SessionRecord[]>;
}

const seedSessions: SessionRecord[] = [
  {
    id: 'ses-001',
    title: 'Java OOP Fundamentals',
    batchId: 'B-2025-13',
    trainerId: 'tr-001',
    trainerName: 'Rajesh Menon',
    trainerEmail: 'rajesh.menon@hexaware.com',
    meetLink: 'https://meet.google.com/abc-defg-hij',
    meetCode: 'abc-defg-hij',
    scheduledAt: '2025-04-28T10:00:00.000Z',
    status: 'completed',
    sessionType: 'training',
    avgClarity: 4.1,
    avgPace: 3.8,
    moodDistribution: { great: 3, good: 1, okay: 1, confused: 0 },
    feedbackCompletion: 80,
    attendanceRate: 92,
    audienceEmails: ['priya.sharma@gmail.com'],
    createdAt: '2025-04-27T08:00:00.000Z',
  },
  {
    id: 'ses-002',
    title: 'SQL Joins & Subqueries',
    batchId: 'B-2025-13',
    trainerId: 'tr-001',
    trainerName: 'Rajesh Menon',
    trainerEmail: 'rajesh.menon@hexaware.com',
    meetLink: 'https://meet.google.com/xyz-abcd-efg',
    meetCode: 'xyz-abcd-efg',
    scheduledAt: '2025-04-29T14:00:00.000Z',
    status: 'completed',
    sessionType: 'training',
    avgClarity: 3.2,
    avgPace: 4.2,
    moodDistribution: { great: 1, good: 1, okay: 2, confused: 1 },
    feedbackCompletion: 60,
    attendanceRate: 88,
    audienceEmails: [],
    createdAt: '2025-04-28T08:00:00.000Z',
  },
];

const seedTranscripts: TranscriptRecord[] = [
  {
    sessionId: 'ses-001',
    summary: [
      'Covered core OOP concepts: classes, objects, inheritance, and polymorphism',
      'Live coding demo showed real-world inheritance hierarchy',
      'Batch engaged well during Q&A on abstract classes',
      'Reviewed access modifiers and encapsulation patterns',
      'Closed with a short quiz on class design principles',
    ],
    keyTerms: ['Inheritance', 'Polymorphism', 'Abstract Classes'],
    confusionTimestamps: [
      { time: '34:00', topic: 'Interface vs Abstract Class', clarityDip: 2.8 },
      { time: '52:00', topic: 'Method overriding rules', clarityDip: 3.1 },
    ],
    rawText:
      'Trainer: Welcome to Java OOP. Today we cover inheritance and polymorphism.\nTrainer: A class is a blueprint; an object is an instance.\nTrainee: Could you clarify interface vs abstract class?',
  },
];

const maverickBatches: Record<string, string> = {
  'mav-001': 'B-2025-13',
  'mav-002': 'B-2025-13',
  'mav-003': 'B-2025-13',
  'mav-004': 'B-2025-13',
  'mav-005': 'B-2025-13',
  'mav-006': 'B-2025-14',
  'mav-007': 'B-2025-14',
};

const audienceEmailBatches: Record<string, string> = {
  'priya.sharma@gmail.com': 'B-2025-13',
};

let sessions = [...seedSessions];
let transcripts = [...seedTranscripts];

const nextSessionId = (): string => {
  const n = sessions.length + 1;
  return `ses-${String(n).padStart(3, '0')}`;
};

export const createSessionStore = (): SessionStore => ({
  async listSessions(filters = {}) {
    return sessions.filter((s) => {
      if (filters.batchId && s.batchId !== filters.batchId) return false;
      if (filters.trainerId && s.trainerId !== filters.trainerId) return false;
      if (filters.status && s.status !== filters.status) return false;
      return true;
    });
  },

  async createSession(input) {
    const session: SessionRecord = {
      id: nextSessionId(),
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
    sessions = [session, ...sessions];
    for (const email of input.audienceEmails) {
      audienceEmailBatches[email.toLowerCase()] = input.batchId;
    }
    return session;
  },

  async updateSessionStatus(sessionId, status) {
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return null;
    sessions[idx] = { ...sessions[idx], status };
    return sessions[idx];
  },

  async updateSessionMetrics(sessionId, metrics) {
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx < 0) return null;
    sessions[idx] = { ...sessions[idx], ...metrics };
    return sessions[idx];
  },

  async getSession(sessionId) {
    return sessions.find((s) => s.id === sessionId) ?? null;
  },

  async getTranscript(sessionId) {
    return transcripts.find((t) => t.sessionId === sessionId) ?? null;
  },

  async upsertTranscript(transcript) {
    const idx = transcripts.findIndex((t) => t.sessionId === transcript.sessionId);
    if (idx >= 0) {
      transcripts[idx] = { ...transcripts[idx], ...transcript };
      return transcripts[idx];
    }
    transcripts = [transcript, ...transcripts];
    return transcript;
  },

  async getSessionsByAudienceEmail(email) {
    const normalized = email.toLowerCase();
    return sessions.filter(
      (s) =>
        s.audienceEmails.some((e) => e.toLowerCase() === normalized) ||
        s.trainerEmail.toLowerCase() === normalized,
    );
  },

  async isMaverickInSessionBatch(maverickId, sessionId) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return false;
    return maverickBatches[maverickId] === session.batchId;
  },

  async isTrainerForSession(trainerId, sessionId) {
    const session = sessions.find((s) => s.id === sessionId);
    return session?.trainerId === trainerId;
  },
});

/** Register maverick email → batch for access checks after roster sync */
export const registerAudienceBatch = (email: string, batchId: string): void => {
  audienceEmailBatches[email.toLowerCase()] = batchId;
};

export const registerMaverickBatch = (maverickId: string, batchId: string): void => {
  maverickBatches[maverickId] = batchId;
};
