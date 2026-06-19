import mockData from './mockData.json'

const KEY = 'nextsteps_maverick_progress_v1'
export const XP_LEVELS = [0, 500, 1500, 3000, 5500, 8000, 12000]
const LEVEL_TITLES = ['Explorer', 'Rising Star', 'Trailblazer', 'Pathfinder', 'Nebula Navigator', 'Star Voyager', 'Galaxy Master']

const defaultState = () => ({
  xp: mockData.currentUser.xp,
  level: mockData.currentUser.level,
  levelTitle: mockData.currentUser.levelTitle,
  missions: mockData.currentUser.dailyMissions.map((m) => ({ ...m })),
  pulseSubmissions: [],
  completedPeerIds: [],
})

export const loadProgress = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaultState(), ...parsed, missions: parsed.missions ?? defaultState().missions }
    }
  } catch {
    /* ignore */
  }
  return defaultState()
}

export const saveProgress = (progress) => {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export const calcLevel = (xp) => {
  let level = 1
  for (let i = XP_LEVELS.length - 1; i >= 0; i -= 1) {
    if (xp >= XP_LEVELS[i]) {
      level = i + 1
      break
    }
  }
  return level
}

export const awardXp = (amount, reason) => {
  const progress = loadProgress()
  progress.xp = (progress.xp || 0) + amount
  progress.level = calcLevel(progress.xp)
  progress.levelTitle = LEVEL_TITLES[progress.level - 1] || LEVEL_TITLES[0]
  if (reason) {
    progress.recentAwards = [{ amount, reason, at: Date.now() }, ...(progress.recentAwards || []).slice(0, 9)]
  }
  saveProgress(progress)
  window.dispatchEvent(new CustomEvent('maverick-xp-updated', { detail: progress }))
  return progress
}

export const completeMission = (missionId) => {
  const progress = loadProgress()
  const mission = progress.missions.find((m) => m.id === missionId)
  if (!mission || mission.completed) return progress
  mission.completed = true
  saveProgress(progress)
  return awardXp(mission.xp, `Mission: ${mission.title}`)
}

export const toggleMissionComplete = (missionId) => {
  const progress = loadProgress()
  const mission = progress.missions.find((m) => m.id === missionId)
  if (!mission) return progress
  if (mission.completed) {
    mission.completed = false
    saveProgress(progress)
    window.dispatchEvent(new CustomEvent('maverick-xp-updated', { detail: progress }))
    return progress
  }
  return completeMission(missionId)
}

export const submitPulseFeedback = (payload) => {
  const progress = loadProgress()
  const entry = {
    ...payload,
    id: `pulse-${Date.now()}`,
    submittedAt: new Date().toISOString(),
    maverickName: payload.maverickName || mockData.currentUser.name,
  }
  progress.pulseSubmissions = [entry, ...(progress.pulseSubmissions || [])]
  saveProgress(progress)
  const dm2 = progress.missions.find((m) => m.id === 'dm2')
  if (dm2 && !dm2.completed) {
    dm2.completed = true
    saveProgress(progress)
    return awardXp(30, 'Pulse feedback')
  }
  return awardXp(30, 'Pulse feedback')
}

export const markPeerFeedbackDone = (peerId) => {
  const progress = loadProgress()
  if (!progress.completedPeerIds.includes(peerId)) {
    progress.completedPeerIds.push(peerId)
    saveProgress(progress)
    return awardXp(40, 'Peer feedback')
  }
  return progress
}
