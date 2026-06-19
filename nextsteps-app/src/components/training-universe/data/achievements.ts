export const ACHIEVEMENTS = [
  { id: 'first-steps', count: 2, emoji: '🌍', title: 'First Steps', subtitle: 'Welcome to the journey' },
  { id: 'on-fire', count: 3, emoji: '🔥', title: 'On Fire', subtitle: "You're on a roll" },
  { id: 'halfway', count: 4, emoji: '⚡', title: 'Halfway There', subtitle: 'Half the galaxy conquered' },
  { id: 'galaxy-master', count: 6, emoji: '👑', title: 'Galaxy Master', subtitle: 'All stages unlocked' },
] as const

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id']

export function getAchievementForCount(unlockedCount: number): (typeof ACHIEVEMENTS)[number] | null {
  const match = [...ACHIEVEMENTS].reverse().find((a) => unlockedCount >= a.count)
  if (!match) return null
  if (unlockedCount === match.count) return match
  return null
}

const DAILY_KEY = 'nextsteps-universe-daily'

interface DailyData {
  date: string
  completions: number
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function loadDailyCompletions(): number {
  try {
    const raw = localStorage.getItem(DAILY_KEY)
    if (!raw) return 0
    const data = JSON.parse(raw) as DailyData
    return data.date === getTodayKey() ? data.completions : 0
  } catch {
    return 0
  }
}

export function incrementDailyCompletions(): number {
  const today = getTodayKey()
  const current = loadDailyCompletions()
  const next = current + 1
  localStorage.setItem(DAILY_KEY, JSON.stringify({ date: today, completions: next }))
  return next
}

export function isDailyChallengeComplete(): boolean {
  return loadDailyCompletions() >= 2
}

const DISMISSED_KEY = 'nextsteps-universe-daily-dismissed'

export function isDailyChallengeDismissed(): boolean {
  return localStorage.getItem(DISMISSED_KEY) === getTodayKey()
}

export function dismissDailyChallenge(): void {
  localStorage.setItem(DISMISSED_KEY, getTodayKey())
}

const ACHIEVEMENTS_KEY = 'nextsteps-universe-achievements'

export function loadUnlockedAchievements(): Set<string> {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY)
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    /* ignore */
  }
  return new Set()
}

export function saveAchievement(id: string): void {
  const set = loadUnlockedAchievements()
  set.add(id)
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...set]))
}

export function checkNewAchievement(unlockedCount: number): (typeof ACHIEVEMENTS)[number] | null {
  const achievement = ACHIEVEMENTS.find((a) => a.count === unlockedCount)
  if (!achievement) return null
  const seen = loadUnlockedAchievements()
  if (seen.has(achievement.id)) return null
  saveAchievement(achievement.id)
  return achievement
}
