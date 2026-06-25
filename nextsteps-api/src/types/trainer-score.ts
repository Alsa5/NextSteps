import type { UserRole } from './auth.js';

export type TrainerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TrainerTierThreshold {
  tier: TrainerTier;
  minScore: number;
  maxScore: number;
  displayName: string;
  icon: string;
  color: string;
}

/**
 * Tier thresholds for trainer scoring.
 * Tiers are based on weighted average score (0-100):
 * - Bronze: 0-40 (building foundation)
 * - Silver: 40-65 (solid performer)
 * - Gold: 65-85 (excellent instructor)
 * - Platinum: 85-100 (exemplary mastery)
 */
export const TIER_THRESHOLDS: TrainerTierThreshold[] = [
  {
    tier: 'bronze',
    minScore: 0,
    maxScore: 40,
    displayName: 'Bronze',
    icon: '🥉',
    color: '#CD7F32', // Bronze color
  },
  {
    tier: 'silver',
    minScore: 40,
    maxScore: 65,
    displayName: 'Silver',
    icon: '🥈',
    color: '#C0C0C0', // Silver color
  },
  {
    tier: 'gold',
    minScore: 65,
    maxScore: 85,
    displayName: 'Gold',
    icon: '🥇',
    color: '#FFD700', // Gold color
  },
  {
    tier: 'platinum',
    minScore: 85,
    maxScore: 100,
    displayName: 'Platinum',
    icon: '💎',
    color: '#E5E4E2', // Platinum color
  },
];

export interface AwePointsAward {
  awardedAt: string;
  awardedBy: string;
  amount: number;
  reason: string;
}

export interface RecentSessionScore {
  sessionId: string;
  batchId: string;
  moodPositivityPercent: number; // (great + good) / total * 100
  averageClarity: number;
  averagePace: number;
  responseRate: number; // submissions / estimated batch size
  submittedAt: string;
  weight: number; // Exponential decay factor: e^(-days / halfLife)
}

export interface Certificate {
  issuedAt: string;
  issuedBy: string;
  tier: string;
  scorePercentage: number;
  totalSessions: number;
}

/**
 * Trainer score record in MongoDB (trainer_scores collection)
 */
export interface TrainerScore {
  _id: string;
  trainerEmail: string;
  trainerName: string;
  
  // Current computed score
  scorePercentage: number; // 0-100 weighted average
  tier: TrainerTier;
  
  // Distance to next tier (0-1 normalized within current tier)
  progressToNextTier: number;
  
  // Manually-awarded points (independent of computed score)
  awePoints: number;
  awePointsHistory: AwePointsAward[];
  
  // Score calculation metadata
  totalSessionsEvaluated: number;
  lastScoreCalculatedAt: string;
  recentSessionScores: RecentSessionScore[]; // Last N sessions that fed into the score
  
  // Streak tracking
  consecutiveHighQualitySessions: number; // Sessions with mood positivity ≥ 70% AND clarity ≥ 4
  
  // Certificates
  certificates?: Certificate[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export function getTierByScore(score: number): TrainerTier {
  const threshold = TIER_THRESHOLDS.find(t => score >= t.minScore && score < t.maxScore);
  return threshold?.tier || 'bronze';
}

export function getTierDisplayName(tier: TrainerTier): string {
  return TIER_THRESHOLDS.find(t => t.tier === tier)?.displayName || tier;
}

export function getTierIcon(tier: TrainerTier): string {
  return TIER_THRESHOLDS.find(t => t.tier === tier)?.icon || '⭐';
}

export function getTierColor(tier: TrainerTier): string {
  return TIER_THRESHOLDS.find(t => t.tier === tier)?.color || '#888888';
}

export function getProgressToNextTier(score: number): number {
  const currentTier = getTierByScore(score);
  const thresholdInfo = TIER_THRESHOLDS.find(t => t.tier === currentTier);
  if (!thresholdInfo) return 0;
  
  const range = thresholdInfo.maxScore - thresholdInfo.minScore;
  const progress = score - thresholdInfo.minScore;
  return Math.max(0, Math.min(1, progress / range));
}
