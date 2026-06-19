import { addNotification } from './appNotifications'

const KEY = 'nextsteps_curriculum_insights_v1'

const SEED = [
  { id: 'ci-1', module: 'SQL Joins (Module 4)', issue: 'Low clarity scores after theory-only delivery', recommendation: 'Add a hands-on lab session immediately after SQL Joins theory', confidence: 92, status: 'pending' },
  { id: 'ci-2', module: 'Communication Skills (Module 1)', issue: 'High engagement but low retention in follow-up quizzes', recommendation: 'Add role-play exercises and real-world email writing tasks', confidence: 74, status: 'pending' },
  { id: 'ci-3', module: 'Angular (Module 7)', issue: 'Prerequisite gap — Mavericks struggle without strong JS foundation', recommendation: 'Add a JavaScript refresher session before Angular module', confidence: 88, status: 'pending' },
]

export const loadCurriculumInsights = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  localStorage.setItem(KEY, JSON.stringify(SEED))
  return SEED
}

export const approveCurriculumInsight = (id) => {
  const insights = loadCurriculumInsights()
  const idx = insights.findIndex((i) => i.id === id)
  if (idx === -1) return insights
  const insight = { ...insights[idx], status: 'approved', approvedAt: new Date().toISOString() }
  insights[idx] = insight
  localStorage.setItem(KEY, JSON.stringify(insights))

  addNotification({
    role: 'trainer',
    title: 'Curriculum update approved',
    body: `L&D approved: "${insight.recommendation}" for ${insight.module}. Schedule this in your next session plan.`,
    link: '/session-analytics',
    meta: { insightId: id },
  })

  return insights
}
