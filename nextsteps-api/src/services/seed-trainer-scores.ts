import { getDb } from '../db/mongo.js';
import type { SessionFeedbackSubmission } from '../types/session-feedback.js';
import type { TrainerScore, RecentSessionScore } from '../types/trainer-score.js';
import { computeWeightedScore } from '../repositories/trainer-score-repository.js';
import { getTierByScore, getProgressToNextTier } from '../types/trainer-score.js';
import { randomUUID } from 'crypto';

/**
 * Seed test trainer scores and session feedback data for development.
 * Only runs when NODE_ENV !== 'production'.
 */
export async function seedTrainerScoresDevData(): Promise<void> {
  const db = getDb();
  const scoresCollection = db.collection<TrainerScore>('trainer_scores');

  const feedbackCollection = db.collection<SessionFeedbackSubmission>('session_feedback');

  // Define fictional trainers with realistic names
  const trainers = [
    { email: 'rajesh.menon@hexaware.com', name: 'Rajesh Menon' },
    { email: 'priya.kumar@hexaware.com', name: 'Priya Kumar' },
    { email: 'amit.sharma@hexaware.com', name: 'Amit Sharma' },
    { email: 'deepti.nair@hexaware.com', name: 'Deepti Nair' },
    { email: 'madhavv@hexaware.com', name: 'Madhav V S' },
    { email: 'sakthia2@hexaware.com', name: 'Sakthi A' },
  ];

  const batchId = 'B-2025-13';
  const now = new Date();

  // Process each trainer with upsert to preserve existing data while adding new ones
  for (const trainer of trainers) {
    // Generate realistic session feedback data for this trainer
    const sessions: RecentSessionScore[] = [];
    const allFeedbackData: SessionFeedbackSubmission[] = [];

    // Determine quality level based on trainer
    const isMadhav = trainer.email === 'madhavv@hexaware.com';
    const isSakthi = trainer.email === 'sakthia2@hexaware.com';
    const baseQuality = isSakthi ? 0.95 : isMadhav ? 0.75 : Math.random() * 0.6 + 0.3;

    // Create 5 recent sessions with varying quality
    for (let i = 0; i < 5; i++) {
      const sessionDate = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000); // 2 days apart
      const sessionId = `session-${trainer.email.split('@')[0]}-${randomUUID()}`;

      // Generate 5-8 maverick responses per session
      const responseCount = Math.floor(Math.random() * 4) + 5;
      let moodGreat = 0, moodGood = 0, moodOkay = 0, moodConfused = 0;
      let totalClarity = 0, totalPace = 0;

      // Vary trainer quality: Sakthi consistently excellent, Madhav good-to-excellent, others variable
      const sessionQuality = baseQuality + (Math.random() * 0.15 - 0.075);

      for (let j = 0; j < responseCount; j++) {
        let mood: 'great' | 'good' | 'okay' | 'confused';
        if (sessionQuality > 0.85) {
          // Excellent session
          mood = Math.random() > 0.1 ? 'great' : 'good';
        } else if (sessionQuality > 0.65) {
          // Good session
          mood = Math.random() > 0.25 ? 'good' : (Math.random() > 0.5 ? 'great' : 'okay');
        } else if (sessionQuality > 0.4) {
          // Average session
          mood = Math.random() > 0.4 ? 'okay' : (Math.random() > 0.6 ? 'good' : 'confused');
        } else {
          // Below average session
          mood = Math.random() > 0.5 ? 'okay' : (Math.random() > 0.6 ? 'confused' : 'good');
        }

        if (mood === 'great') moodGreat++;
        else if (mood === 'good') moodGood++;
        else if (mood === 'okay') moodOkay++;
        else moodConfused++;

        // Sakthi and Madhav have better clarity/pace
        const baseClarity = isSakthi ? 4.6 : isMadhav ? 4.1 : 3.5;
        const clarity = Math.min(5, Math.max(3, baseClarity + (Math.random() * 0.6 - 0.3)));
        const basePace = isSakthi ? 4.5 : isMadhav ? 4.0 : 3.4;
        const pace = Math.min(5, Math.max(3, basePace + (Math.random() * 0.6 - 0.3)));

        totalClarity += clarity;
        totalPace += pace;

        const feedback: SessionFeedbackSubmission = {
          _id: randomUUID(),
          sessionId,
          batchId,
          trainerEmail: trainer.email,
          maverickId: `mav-test-${i}-${j}`,
          maverickName: `Maverick ${j + 1}`,
          mood,
          clarity: +clarity.toFixed(1),
          pace: +pace.toFixed(1),
          openText: sessionQuality > 0.6 ? `Great session on day ${i}` : undefined,
          submittedAt: sessionDate.toISOString(),
        };

        allFeedbackData.push(feedback);
      }

      // Calculate metrics for this session
      const moodPositivityPercent = ((moodGreat + moodGood) / responseCount) * 100;
      const avgClarity = totalClarity / responseCount;
      const avgPace = totalPace / responseCount;

      // Exponential decay weight: more recent sessions weighted higher
      const daysOld = (now.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000);
      const halfLifeDays = 7; // 1-week half-life
      const weight = Math.exp(-daysOld / halfLifeDays);

      sessions.push({
        sessionId,
        batchId,
        moodPositivityPercent,
        averageClarity: +(avgClarity.toFixed(1)),
        averagePace: +(avgPace.toFixed(1)),
        responseRate: responseCount / 10, // Assume batch size of ~10
        submittedAt: sessionDate.toISOString(),
        weight,
      });
    }

    // Insert all feedback data for this trainer
    if (allFeedbackData.length > 0) {
      await feedbackCollection.insertMany(allFeedbackData);
    }

    // Compute score from sessions
    const scorePercentage = computeWeightedScore(sessions);
    const tier = getTierByScore(scorePercentage);
    const progressToNextTier = getProgressToNextTier(scorePercentage);

    // Create trainer score record
    const trainerScore: TrainerScore = {
      _id: randomUUID(),
      trainerEmail: trainer.email,
      trainerName: trainer.name,
      scorePercentage,
      tier,
      progressToNextTier,
      awePoints: 0,
      awePointsHistory: [],
      totalSessionsEvaluated: sessions.length,
      lastScoreCalculatedAt: now.toISOString(),
      recentSessionScores: sessions,
      consecutiveHighQualitySessions: sessions.filter(
        s => s.moodPositivityPercent >= 70 && s.averageClarity >= 4
      ).length,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Upsert: preserve existing trainers, insert new ones like Madhav and Sakthi
    await scoresCollection.updateOne(
      { trainerEmail: trainer.email },
      { $setOnInsert: trainerScore },
      { upsert: true }
    );
    
    const existingTrainer = await scoresCollection.findOne({ trainerEmail: trainer.email });
    console.log(
      `✨ Trainer ${trainer.name} (${trainer.email}): Score ${existingTrainer?.scorePercentage || scorePercentage}, Tier ${existingTrainer?.tier || tier}`
    );
  }
}
