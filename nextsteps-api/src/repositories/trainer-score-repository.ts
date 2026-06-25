import { randomUUID } from 'crypto';
import { getDb } from '../db/mongo.js';
import type { TrainerScore, RecentSessionScore, TrainerTier } from '../types/trainer-score.js';
import { getTierByScore, getProgressToNextTier } from '../types/trainer-score.js';

export interface TrainerScoreRepository {
  upsertScore(trainerEmail: string, trainerName: string, scoreData: Partial<TrainerScore>): Promise<TrainerScore>;
  getByEmail(trainerEmail: string): Promise<TrainerScore | null>;
  getLeaderboard(limit?: number): Promise<TrainerScore[]>;
  awardAwePoints(trainerEmail: string, amount: number, reason: string, awardedBy: string): Promise<TrainerScore>;
  storeCertificate(trainerEmail: string, certificate: object): Promise<TrainerScore>;
  findAll(): Promise<TrainerScore[]>;
  computeScoreFromSessions(recentSessions: RecentSessionScore[]): number;
}

export const createTrainerScoreRepository = (): TrainerScoreRepository => {
  const collection = () => getDb().collection<TrainerScore>('trainer_scores');

  return {
    async upsertScore(trainerEmail, trainerName, scoreData) {
      const now = new Date().toISOString();
      const normalized = trainerEmail.toLowerCase();

      // Compute score from recent sessions if provided
      let score = scoreData.scorePercentage ?? 0;
      if (scoreData.recentSessionScores && scoreData.recentSessionScores.length > 0) {
        score = computeWeightedScore(scoreData.recentSessionScores);
      }

      const tier = getTierByScore(score);
      const progressToNextTier = getProgressToNextTier(score);

      const result = await collection().findOneAndUpdate(
        { trainerEmail: normalized },
        {
          $set: {
            trainerEmail: normalized,
            trainerName,
            scorePercentage: score,
            tier,
            progressToNextTier,
            ...scoreData,
            updatedAt: now,
          },
          $setOnInsert: {
            _id: randomUUID(),
            awePoints: 0,
            awePointsHistory: [],
            totalSessionsEvaluated: 0,
            consecutiveHighQualitySessions: 0,
            recentSessionScores: [],
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Failed to upsert trainer score');
      }

      return result as unknown as TrainerScore;
    },

    async getByEmail(trainerEmail) {
      const normalized = trainerEmail.toLowerCase();
      return collection().findOne({ trainerEmail: normalized });
    },

    async getLeaderboard(limit = 50) {
      return collection()
        .find({})
        .sort({ scorePercentage: -1, awePoints: -1 })
        .limit(limit)
        .toArray();
    },

    async awardAwePoints(trainerEmail, amount, reason, awardedBy) {
      const normalized = trainerEmail.toLowerCase();
      const now = new Date().toISOString();

      const result = await collection().findOneAndUpdate(
        { trainerEmail: normalized },
        {
          $inc: { awePoints: amount },
          $push: {
            awePointsHistory: {
              awardedAt: now,
              awardedBy,
              amount,
              reason,
            },
          },
          $set: { updatedAt: now },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Trainer not found');
      }

      return result as unknown as TrainerScore;
    },

    async storeCertificate(trainerEmail, certificate) {
      const normalized = trainerEmail.toLowerCase();
      const now = new Date().toISOString();

      const result = await collection().findOneAndUpdate(
        { trainerEmail: normalized },
        {
          $push: { certificates: certificate } as any,
          $set: { updatedAt: now },
        },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Trainer not found');
      }

      return result as unknown as TrainerScore;
    },

    async findAll() {
      return collection().find({}).toArray();
    },

    computeScoreFromSessions(recentSessions) {
      return computeWeightedScore(recentSessions);
    },
  };
};

/**
 * Compute weighted score from recent sessions using exponential decay.
 * More recent sessions contribute more heavily to the final score.
 */
export function computeWeightedScore(sessions: RecentSessionScore[]): number {
  if (sessions.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  sessions.forEach(session => {
    // Each session contributes: (mood% * 0.4 + clarity/5 * 0.3 + pace/5 * 0.2 + responseRate * 0.1) * weight
    const componentScore =
      (session.moodPositivityPercent / 100) * 0.4 +
      (session.averageClarity / 5) * 0.3 +
      (session.averagePace / 5) * 0.2 +
      session.responseRate * 0.1;

    const scaledScore = componentScore * 100;
    weightedSum += scaledScore * session.weight;
    totalWeight += session.weight;
  });

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 10) / 10; // Round to 1 decimal
}
