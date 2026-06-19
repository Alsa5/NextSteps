export const XP_PER_COURSE = 150
export const STREAK_BONUS_XP = 50
export const STREAK_WINDOW_MS = 24 * 60 * 60 * 1000

export const RANKS = ['Cadet', 'Navigator', 'Commander', 'Admiral', 'Legend'] as const
export type Rank = (typeof RANKS)[number]

export function getRank(unlockedCount: number): Rank {
  if (unlockedCount >= 8) return 'Legend'
  const index = Math.min(Math.floor(unlockedCount / 3), RANKS.length - 1)
  return RANKS[index]
}

export function getRankIndex(unlockedCount: number): number {
  return RANKS.indexOf(getRank(unlockedCount))
}

export function didLevelUp(prevCount: number, newCount: number): boolean {
  return getRankIndex(newCount) > getRankIndex(prevCount)
}

export function getXpProgress(unlockedCount: number): { current: number; max: number } {
  const planetsInRank = unlockedCount % 3 || (unlockedCount > 0 && unlockedCount % 3 === 0 ? 3 : 0)
  const current = unlockedCount === 0 ? 0 : planetsInRank === 0 ? 3 : planetsInRank
  return { current, max: 3 }
}

const STORAGE_KEY = 'universe-streak'

interface StreakData {
  streak: number
  lastUnlock: number
}

export function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StreakData
  } catch {
    /* ignore */
  }
  return { streak: 0, lastUnlock: 0 }
}

export function saveStreak(data: StreakData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function updateStreakOnUnlock(): { streak: number; bonusXp: number } {
  const now = Date.now()
  const prev = loadStreak()
  let streak = prev.streak
  let bonusXp = 0

  if (prev.lastUnlock && now - prev.lastUnlock < STREAK_WINDOW_MS) {
    streak = prev.streak + 1
    bonusXp = STREAK_BONUS_XP
  } else if (!prev.lastUnlock || now - prev.lastUnlock >= STREAK_WINDOW_MS * 2) {
    streak = 1
  } else {
    streak = 1
  }

  saveStreak({ streak, lastUnlock: now })
  return { streak, bonusXp }
}
