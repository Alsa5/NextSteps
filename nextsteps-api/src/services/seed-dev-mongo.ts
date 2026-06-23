import { getDb, NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { SessionRecord, TranscriptRecord } from '../types/analytics.js';
import type {
  CohortMetrics,
  CurriculumCopilotResponse,
  ReminderTimingResponse,
  TopPerformersResponse,
} from '../types/p7-analytics.js';

const BATCH_ID = 'B-2025-13';
const BATCH_ID_2 = 'B-2025-14';
const ENROLLED_MAVERICKS = ['mav-001', 'mav-002', 'mav-003', 'mav-004', 'mav-005'];
const TRAINER_ID = 'tr-001';

const seedSessions: SessionRecord[] = [
  {
    id: 'ses-001',
    title: 'Java OOP Fundamentals',
    batchId: BATCH_ID,
    trainerId: TRAINER_ID,
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
    batchId: BATCH_ID,
    trainerId: TRAINER_ID,
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

const BATCH_METRICS: Record<string, CohortMetrics> = {
  [BATCH_ID]: {
    feedbackCompletionPercent: 70,
    quizAverage: 78,
    readinessScore: 72,
    streamDistribution: { 'full-stack': 3, data: 2 },
  },
  [BATCH_ID_2]: {
    feedbackCompletionPercent: 85,
    quizAverage: 82,
    readinessScore: 79,
    streamDistribution: { 'full-stack': 2, cloud: 3 },
  },
};

const seedFeedbackSubmissions = [
  { sessionId: 'ses-001', maverickId: 'mav-001', submittedAt: '2025-04-28T12:00:00.000Z' },
  { sessionId: 'ses-001', maverickId: 'mav-002', submittedAt: '2025-04-28T12:05:00.000Z' },
  { sessionId: 'ses-001', maverickId: 'mav-003', submittedAt: '2025-04-28T12:10:00.000Z' },
  { sessionId: 'ses-001', maverickId: 'mav-004', submittedAt: '2025-04-28T12:15:00.000Z' },
  { sessionId: 'ses-002', maverickId: 'mav-001', submittedAt: '2025-04-29T16:00:00.000Z' },
  { sessionId: 'ses-002', maverickId: 'mav-002', submittedAt: '2025-04-29T16:05:00.000Z' },
  { sessionId: 'ses-002', maverickId: 'mav-003', submittedAt: '2025-04-29T16:10:00.000Z' },
];

const maverickBatches: Record<string, string> = {
  'mav-001': BATCH_ID,
  'mav-002': BATCH_ID,
  'mav-003': BATCH_ID,
  'mav-004': BATCH_ID,
  'mav-005': BATCH_ID,
  'mav-006': BATCH_ID_2,
  'mav-007': BATCH_ID_2,
};

const curriculumByBatch: Record<string, CurriculumCopilotResponse['recommendations']> = {
  [BATCH_ID]: [
    {
      topic: 'Async JavaScript patterns',
      confidencePercent: 82,
      rationale:
        'Confusion spikes in 3 sessions across batches; pulse feedback cites event-loop clarity.',
      affectedBatchIds: [BATCH_ID, BATCH_ID_2],
      suggestedAction: 'extend-session',
    },
    {
      topic: 'REST API design fundamentals',
      confidencePercent: 74,
      rationale: 'Quiz scores below cohort average on HTTP verbs and status codes modules.',
      affectedBatchIds: [BATCH_ID],
      suggestedAction: 'revise-content',
    },
  ],
  [BATCH_ID_2]: [
    {
      topic: 'Async JavaScript patterns',
      confidencePercent: 82,
      rationale:
        'Confusion spikes in 3 sessions across batches; pulse feedback cites event-loop clarity.',
      affectedBatchIds: [BATCH_ID, BATCH_ID_2],
      suggestedAction: 'extend-session',
    },
  ],
};

const topPerformersByBatch: Record<string, Omit<TopPerformersResponse, 'batchId'>> = {
  [BATCH_ID]: {
    topPercentile: 10,
    totalMavericks: 10,
    performers: [
      {
        maverickId: 'mav-001',
        displayName: 'Alex Chen',
        compositeScore: 94,
        rank: 1,
        sonicNominationEligible: true,
        strideFastTrackEligible: true,
      },
      {
        maverickId: 'mav-003',
        displayName: 'Jordan Lee',
        compositeScore: 91,
        rank: 2,
        sonicNominationEligible: true,
        strideFastTrackEligible: false,
      },
    ],
  },
  [BATCH_ID_2]: {
    topPercentile: 10,
    totalMavericks: 8,
    performers: [
      {
        maverickId: 'mav-006',
        displayName: 'Sam Rivera',
        compositeScore: 88,
        rank: 1,
        sonicNominationEligible: true,
        strideFastTrackEligible: false,
      },
    ],
  },
};

const reminderTimingsByBatch: Record<string, Omit<ReminderTimingResponse, 'batchId'>> = {
  [BATCH_ID]: {
    modelVersion: 'stub-v1',
    maverickTimings: [
      {
        maverickId: 'mav-004',
        optimalHourUtc: 14,
        engagementScore: 0.82,
        preferredChannel: 'email',
      },
      {
        maverickId: 'mav-005',
        optimalHourUtc: 18,
        engagementScore: 0.71,
        preferredChannel: 'sms',
      },
    ],
  },
  [BATCH_ID_2]: {
    modelVersion: 'stub-v1',
    maverickTimings: [
      {
        maverickId: 'mav-006',
        optimalHourUtc: 10,
        engagementScore: 0.75,
        preferredChannel: 'email',
      },
    ],
  },
};

/** Idempotent dev/demo seed for Mongo-backed repositories (non-production only). */
export const seedDevMongoData = async (): Promise<void> => {
  const db = getDb();

  for (const session of seedSessions) {
    await db.collection(NEXTSTEPS_COLLECTIONS.SESSIONS).updateOne(
      { id: session.id },
      { $set: session },
      { upsert: true },
    );
  }

  for (const transcript of seedTranscripts) {
    await db.collection(NEXTSTEPS_COLLECTIONS.SESSION_TRANSCRIPTS).updateOne(
      { sessionId: transcript.sessionId },
      { $set: transcript },
      { upsert: true },
    );
  }

  await db.collection(NEXTSTEPS_COLLECTIONS.BATCH_FEEDBACK_STATE).updateOne(
    { batchId: BATCH_ID },
    {
      $set: {
        batchId: BATCH_ID,
        trainerId: TRAINER_ID,
        enrolledMaverickIds: ENROLLED_MAVERICKS,
        xpBonusAwarded: false,
        reminderTiers: { day0: true, day1: false, day2: false },
      },
    },
    { upsert: true },
  );

  for (const sub of seedFeedbackSubmissions) {
    await db.collection(NEXTSTEPS_COLLECTIONS.FEEDBACK_SUBMISSIONS).updateOne(
      { batchId: BATCH_ID, sessionId: sub.sessionId, maverickId: sub.maverickId },
      { $set: { batchId: BATCH_ID, ...sub } },
      { upsert: true },
    );
  }

  for (const [maverickId, batchId] of Object.entries(maverickBatches)) {
    await db.collection(NEXTSTEPS_COLLECTIONS.MAVERICK_BATCH_MEMBERSHIPS).updateOne(
      { maverickId },
      { $set: { maverickId, batchId } },
      { upsert: true },
    );
  }

  for (const [batchId, metrics] of Object.entries(BATCH_METRICS)) {
    await db.collection(NEXTSTEPS_COLLECTIONS.P7_BATCH_METRICS).updateOne(
      { batchId },
      { $set: { batchId, metrics } },
      { upsert: true },
    );
  }

  for (const [batchId, recommendations] of Object.entries(curriculumByBatch)) {
    await db.collection(NEXTSTEPS_COLLECTIONS.P7_CURRICULUM_RECOMMENDATIONS).updateOne(
      { batchId },
      { $set: { batchId, recommendations } },
      { upsert: true },
    );
  }

  for (const [batchId, data] of Object.entries(topPerformersByBatch)) {
    await db.collection(NEXTSTEPS_COLLECTIONS.P7_TOP_PERFORMERS).updateOne(
      { batchId },
      { $set: { batchId, ...data } },
      { upsert: true },
    );
  }

  for (const [batchId, data] of Object.entries(reminderTimingsByBatch)) {
    await db.collection(NEXTSTEPS_COLLECTIONS.P7_REMINDER_TIMINGS).updateOne(
      { batchId },
      { $set: { batchId, ...data } },
      { upsert: true },
    );
  }

  console.log('Seeded dev Mongo data (sessions, feedback, P7 analytics)');
};
