import { randomUUID } from 'crypto';
import { ObjectId, type Db } from 'mongodb';
import { NEXTSTEPS_COLLECTIONS } from '../db/mongo.js';
import type { NextStepsUser } from '../db/schemas.js';
import type { SessionRecord, TranscriptRecord } from '../types/analytics.js';
import type {
  CohortMetrics,
  CurriculumCopilotResponse,
  ReminderTimingResponse,
  TopPerformersResponse,
} from '../types/p7-analytics.js';
import type { UserRole } from '../types/auth.js';
import type { AppNotification } from '../repositories/notification-repository.js';
import { buildTraineeSeedEntries } from './seed-trainee-registry.js';

const BATCH_ID = 'B-2025-13';
const BATCH_ID_2 = 'B-2025-14';
const ENROLLED_MAVERICKS = ['mav-001', 'mav-002', 'mav-003', 'mav-004', 'mav-005'];
const TRAINER_ID = 'tr-001';
const NOW = () => new Date().toISOString();

const DEV_USERS: Array<{
  email: string;
  fullName: string;
  role: UserRole;
  authProvider: 'azure' | 'email';
  hexId?: string;
  designation?: string;
}> = [
  {
    email: 'sakthia2@hexaware.com',
    fullName: 'Sakthi Alagappan',
    role: 'ld',
    authProvider: 'azure',
    hexId: '2000147951',
    designation: 'L&D Executive',
  },
  {
    email: 'rajesh.menon@hexaware.com',
    fullName: 'Rajesh Menon',
    role: 'trainer',
    authProvider: 'azure',
    designation: 'Senior Trainer',
  },
  {
    email: 'priya.sharma@gmail.com',
    fullName: 'Priya Sharma',
    role: 'maverick',
    authProvider: 'email',
  },
  {
    email: 'arjun.reddy@gmail.com',
    fullName: 'Arjun Reddy',
    role: 'maverick',
    authProvider: 'email',
  },
  {
    email: 'trainer.demo@external.com',
    fullName: 'Demo Trainer',
    role: 'trainer',
    authProvider: 'email',
  },
];

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

const seedSessionTranscripts: TranscriptRecord[] = [
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

const seedQuizzes = [
  {
    id: 'quiz-1640000000000',
    batch: BATCH_ID,
    trainerEmail: 'trainer@hexaware.com',
    title: 'JavaScript Fundamentals - Week 1',
    weekNumber: 1,
  },
  {
    id: 'quiz-1640000000001',
    batch: BATCH_ID,
    trainerEmail: 'trainer@hexaware.com',
    title: 'React Hooks - Week 2',
    weekNumber: 2,
  },
];

const seedQuizSubmissions = [
  {
    quizId: 'quiz-1640000000000',
    weekNumber: 1,
    batch: BATCH_ID,
    trainerEmail: 'trainer@hexaware.com',
    maverickId: 'mav-001',
    maverickName: 'Priya Sharma',
    quizTitle: 'JavaScript Fundamentals - Week 1',
    answers: [
      { questionId: 0, questionText: 'What is a variable?', selectedOption: 0, correctOption: 0, isCorrect: true },
      { questionId: 1, questionText: 'Which is a loop?', selectedOption: 1, correctOption: 2, isCorrect: false },
      { questionId: 2, questionText: 'What is a function?', selectedOption: 2, correctOption: 2, isCorrect: true },
    ],
    score: 2,
    totalQuestions: 3,
    scorePercent: 67,
    submittedAt: new Date('2025-01-20T10:30:00Z'),
  },
  {
    quizId: 'quiz-1640000000000',
    weekNumber: 1,
    batch: BATCH_ID,
    trainerEmail: 'trainer@hexaware.com',
    maverickId: 'mav-002',
    maverickName: 'Arjun Kumar',
    quizTitle: 'JavaScript Fundamentals - Week 1',
    answers: [
      { questionId: 0, questionText: 'What is a variable?', selectedOption: 0, correctOption: 0, isCorrect: true },
      { questionId: 1, questionText: 'Which is a loop?', selectedOption: 2, correctOption: 2, isCorrect: true },
      { questionId: 2, questionText: 'What is a function?', selectedOption: 1, correctOption: 2, isCorrect: false },
    ],
    score: 2,
    totalQuestions: 3,
    scorePercent: 67,
    submittedAt: new Date('2025-01-20T11:15:00Z'),
  },
  {
    quizId: 'quiz-1640000000001',
    weekNumber: 2,
    batch: BATCH_ID,
    trainerEmail: 'trainer@hexaware.com',
    maverickId: 'mav-001',
    maverickName: 'Priya Sharma',
    quizTitle: 'React Hooks - Week 2',
    answers: [
      { questionId: 0, questionText: 'What is useState?', selectedOption: 0, correctOption: 0, isCorrect: true },
      { questionId: 1, questionText: 'What is useEffect?', selectedOption: 0, correctOption: 0, isCorrect: true },
      { questionId: 2, questionText: 'What is useContext?', selectedOption: 2, correctOption: 2, isCorrect: true },
      { questionId: 3, questionText: 'What is useMemo?', selectedOption: 1, correctOption: 1, isCorrect: true },
      { questionId: 4, questionText: 'What is useCallback?', selectedOption: 0, correctOption: 2, isCorrect: false },
    ],
    score: 4,
    totalQuestions: 5,
    scorePercent: 80,
    submittedAt: new Date('2025-01-21T14:20:00Z'),
  },
];

const seedNotifications: Omit<AppNotification, 'read' | 'createdAt'>[] = [
  {
    id: 'note-welcome-maverick',
    recipientEmail: 'priya.sharma@gmail.com',
    role: 'maverick',
    title: 'Welcome to the Nebula',
    body: 'Your batch B-2025-13 onboarding path is ready.',
    link: '/maverick/dashboard',
    meta: { batchId: BATCH_ID },
  },
  {
    id: 'note-session-reminder',
    recipientEmail: 'priya.sharma@gmail.com',
    role: 'maverick',
    title: 'Session recap available',
    body: 'Java OOP Fundamentals transcript summary is ready to review.',
    link: '/maverick/sessions/ses-001',
    meta: { sessionId: 'ses-001' },
  },
  {
    id: 'note-ld-dashboard',
    recipientEmail: 'sakthia2@hexaware.com',
    role: 'ld',
    title: 'Batch health update',
    body: 'B-2025-13 feedback completion is at 70%.',
    link: '/ld/feedback-analytics',
    meta: { batchId: BATCH_ID },
  },
];

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

/** Idempotent demo seed for all Mongo collections (local or Cosmos). */
export const seedDemoData = async (db: Db): Promise<void> => {
  const now = NOW();
  let usersSeeded = 0;

  for (const account of DEV_USERS) {
    const email = account.email.toLowerCase();
    const existing = await db
      .collection<NextStepsUser>(NEXTSTEPS_COLLECTIONS.USERS)
      .findOne({ email });

    if (existing) {
      await db.collection<NextStepsUser>(NEXTSTEPS_COLLECTIONS.USERS).updateOne(
        { email },
        {
          $set: {
            fullName: account.fullName,
            role: account.role,
            authProvider: account.authProvider,
            designation: account.designation,
            hexId: account.hexId,
            updatedAt: now,
          },
        },
      );
    } else {
      await db.collection<NextStepsUser>(NEXTSTEPS_COLLECTIONS.USERS).insertOne({
        _id: randomUUID(),
        email,
        fullName: account.fullName,
        role: account.role,
        authProvider: account.authProvider,
        designation: account.designation,
        hexId: account.hexId,
        createdAt: now,
        updatedAt: now,
      });
      usersSeeded += 1;
    }
  }

  const traineeEntries = buildTraineeSeedEntries();
  for (const entry of traineeEntries) {
    const email = entry.email.toLowerCase();
    const signInEligible = Boolean(entry.batch && String(entry.batch).trim());
    await db.collection(NEXTSTEPS_COLLECTIONS.TRAINEE_REGISTRY).updateOne(
      { email },
      {
        $set: {
          email,
          fullName: entry.fullName,
          batch: entry.batch,
          status: entry.status,
          externalId: entry.externalId,
          signInEligible,
          updatedAt: now,
        },
        $setOnInsert: { _id: randomUUID() },
      },
      { upsert: true },
    );
  }

  for (const session of seedSessions) {
    await db.collection(NEXTSTEPS_COLLECTIONS.SESSIONS).updateOne(
      { id: session.id },
      { $set: session },
      { upsert: true },
    );
  }

  for (const transcript of seedSessionTranscripts) {
    await db.collection(NEXTSTEPS_COLLECTIONS.SESSION_TRANSCRIPTS).updateOne(
      { sessionId: transcript.sessionId },
      { $set: transcript },
      { upsert: true },
    );
  }

  const workerTranscriptAt = new Date('2025-04-28T11:00:00.000Z');
  await db.collection(NEXTSTEPS_COLLECTIONS.TRANSCRIPTS).updateOne(
    { sessionId: 'ses-001' },
    {
      $set: {
        sessionId: 'ses-001',
        rawTextRef: 'seed:ses-001',
        summary: seedSessionTranscripts[0].summary,
        keyTerms: seedSessionTranscripts[0].keyTerms,
        confusionTimestamps: seedSessionTranscripts[0].confusionTimestamps,
        createdAt: workerTranscriptAt,
        updatedAt: workerTranscriptAt,
      },
    },
    { upsert: true },
  );

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

  for (const quiz of seedQuizzes) {
    await db.collection(NEXTSTEPS_COLLECTIONS.QUIZZES).updateOne(
      { id: quiz.id },
      { $set: quiz },
      { upsert: true },
    );
  }

  for (const submission of seedQuizSubmissions) {
    await db.collection(NEXTSTEPS_COLLECTIONS.QUIZ_SUBMISSIONS).updateOne(
      {
        batch: submission.batch,
        maverickId: submission.maverickId,
        quizId: submission.quizId,
      },
      {
        $set: submission,
        $setOnInsert: { _id: new ObjectId() },
      },
      { upsert: true },
    );
  }

  for (const note of seedNotifications) {
    await db.collection<AppNotification>(NEXTSTEPS_COLLECTIONS.NOTIFICATIONS).updateOne(
      { id: note.id },
      {
        $set: { ...note, read: false, createdAt: now },
      },
      { upsert: true },
    );
  }

  await db.collection(NEXTSTEPS_COLLECTIONS.AUDIT_LOGS).updateOne(
    { id: 'audit-seed-ld-dashboard' },
    {
      $set: {
        id: 'audit-seed-ld-dashboard',
        timestamp: now,
        actorId: 'ld-seed',
        actorRole: 'ld',
        resourceType: 'feedback-dashboard',
        resourceId: BATCH_ID,
        action: 'read',
        route: '/api/v1/ld/batches/B-2025-13/feedback-dashboard',
      },
    },
    { upsert: true },
  );

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

  console.log('Demo data seeded:');
  console.log(`  users: ${DEV_USERS.length} (${usersSeeded} new)`);
  console.log(`  trainee_registry: ${traineeEntries.length}`);
  console.log(`  sessions: ${seedSessions.length}`);
  console.log(`  session_transcripts: ${seedSessionTranscripts.length}`);
  console.log(`  transcripts (worker): 1`);
  console.log(`  feedback_submissions: ${seedFeedbackSubmissions.length}`);
  console.log(`  batch_feedback_state: 1`);
  console.log(`  maverick_batch_memberships: ${Object.keys(maverickBatches).length}`);
  console.log(`  quizzes: ${seedQuizzes.length}`);
  console.log(`  quiz_submissions: ${seedQuizSubmissions.length}`);
  console.log(`  notifications: ${seedNotifications.length}`);
  console.log(`  audit_logs: 1`);
  console.log(`  p7_* collections: metrics, curriculum, performers, reminders for 2 batches`);
};
