/**
 * Trainer tier utilities for frontend
 * Must match backend tier definitions in nextsteps-api/src/types/trainer-score.ts
 */

const TIER_THRESHOLDS = {
  bronze: {
    tier: 'bronze',
    minScore: 0,
    maxScore: 40,
    displayName: 'Bronze',
    icon: '🥉',
    color: '#CD7F32',
  },
  silver: {
    tier: 'silver',
    minScore: 40,
    maxScore: 65,
    displayName: 'Silver',
    icon: '🥈',
    color: '#C0C0C0',
  },
  gold: {
    tier: 'gold',
    minScore: 65,
    maxScore: 85,
    displayName: 'Gold',
    icon: '🥇',
    color: '#FFD700',
  },
  platinum: {
    tier: 'platinum',
    minScore: 85,
    maxScore: 100,
    displayName: 'Platinum',
    icon: '💎',
    color: '#E5E4E2',
  },
}

export function getTierByScore(score) {
  for (const tier of Object.values(TIER_THRESHOLDS)) {
    if (score >= tier.minScore && score < tier.maxScore) {
      return tier.tier
    }
  }
  return 'bronze'
}

export function getTierDisplayName(tier) {
  return TIER_THRESHOLDS[tier]?.displayName || tier
}

export function getTierIcon(tier) {
  return TIER_THRESHOLDS[tier]?.icon || '⭐'
}

export function getTierColor(tier) {
  return TIER_THRESHOLDS[tier]?.color || '#888888'
}

export function getProgressToNextTier(score) {
  const tier = getTierByScore(score)
  const thresholdInfo = TIER_THRESHOLDS[tier]
  if (!thresholdInfo) return 0

  const range = thresholdInfo.maxScore - thresholdInfo.minScore
  const progress = score - thresholdInfo.minScore
  return Math.max(0, Math.min(1, progress / range))
}
