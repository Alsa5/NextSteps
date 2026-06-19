import mockData from '../../../data/mockData.json'
import { XP_PER_COURSE } from './gamification'
import { FINAL_STAGE_INDEX } from './trainingStages'

const PROGRESS_KEY = 'nextsteps-universe-progress'
const PROGRESS_VERSION = 3

/** v1 order: 0=Pre-Onboarding, 1=Spark … 5=Deployment */
const LEGACY_V1_TO_V3: Record<number, number> = {
  0: -1,
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
}

/** v2 order: 0=Spark … 4=Deployment, 5=Onboarding */
const LEGACY_V2_TO_V3: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 4,
}

export interface UniverseProgress {
  version?: number
  unlockedIndices: number[]
  currentIndex: number
  totalXp: number
}

const buildUnlockedThrough = (currentIndex: number): number[] => {
  const indices: number[] = []
  const max = Math.min(currentIndex, FINAL_STAGE_INDEX)
  for (let i = 0; i <= max; i += 1) indices.push(i)
  return indices
}

const buildFromUserPhase = (): UniverseProgress => {
  const phase = mockData.currentUser?.phase ?? 1
  const currentIndex = Math.min(Math.max(phase - 1, 0), FINAL_STAGE_INDEX)
  return {
    version: PROGRESS_VERSION,
    unlockedIndices: buildUnlockedThrough(currentIndex),
    currentIndex,
    totalXp: currentIndex * XP_PER_COURSE,
  }
}

const mapLegacyIndex = (index: number, version: number): number => {
  if (version >= 2) return LEGACY_V2_TO_V3[index] ?? index
  return LEGACY_V1_TO_V3[index] ?? index
}

const migrateLegacyProgress = (parsed: UniverseProgress): UniverseProgress => {
  const sourceVersion = parsed.version ?? 1
  const mappedUnlocked = parsed.unlockedIndices
    .map((i) => mapLegacyIndex(i, sourceVersion))
    .filter((i) => i >= 0 && i <= FINAL_STAGE_INDEX)

  const mappedCurrent = mapLegacyIndex(parsed.currentIndex, sourceVersion)
  const currentIndex = Math.min(Math.max(mappedCurrent, 0), FINAL_STAGE_INDEX)

  const unlockedSet = new Set<number>(buildUnlockedThrough(currentIndex))
  mappedUnlocked.forEach((i) => unlockedSet.add(i))

  const unlockedIndices = [...unlockedSet].sort((a, b) => a - b)
  return {
    version: PROGRESS_VERSION,
    unlockedIndices,
    currentIndex,
    totalXp: parsed.totalXp ?? currentIndex * XP_PER_COURSE,
  }
}

const normalizeProgress = (parsed: UniverseProgress): UniverseProgress => {
  if ((parsed.version ?? 1) < PROGRESS_VERSION) {
    return migrateLegacyProgress(parsed)
  }

  const currentIndex = Math.min(Math.max(parsed.currentIndex, 0), FINAL_STAGE_INDEX)
  const unlockedSet = new Set(
    parsed.unlockedIndices.filter((i) => i >= 0 && i <= FINAL_STAGE_INDEX),
  )

  const maxUnlocked = Math.max(...parsed.unlockedIndices.filter((i) => i <= FINAL_STAGE_INDEX), -1)
  for (let i = 0; i <= maxUnlocked; i += 1) unlockedSet.add(i)

  return {
    version: PROGRESS_VERSION,
    unlockedIndices: [...unlockedSet].sort((a, b) => a - b),
    currentIndex,
    totalXp: parsed.totalXp ?? currentIndex * XP_PER_COURSE,
  }
}

export const loadUniverseProgress = (): UniverseProgress => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as UniverseProgress
      if (Array.isArray(parsed.unlockedIndices) && parsed.unlockedIndices.length > 0) {
        const normalized = normalizeProgress(parsed)
        if ((parsed.version ?? 1) < PROGRESS_VERSION) {
          saveUniverseProgress(normalized)
        }
        return normalized
      }
    }
  } catch {
    /* ignore */
  }
  return buildFromUserPhase()
}

export const saveUniverseProgress = (progress: UniverseProgress): void => {
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({ ...progress, version: PROGRESS_VERSION }),
  )
}

export const clearUniverseProgress = (): void => {
  localStorage.removeItem(PROGRESS_KEY)
}
