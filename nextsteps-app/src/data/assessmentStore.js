import { addNotification } from './appNotifications'

const KEY = 'nextsteps_assessments_v1'

export const loadAssessments = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export const publishAssessment = ({ title, batch, questions, trainerName = 'Trainer' }) => {
  const quiz = {
    id: `quiz-${Date.now()}`,
    title: title.trim(),
    batch,
    questions,
    publishedAt: new Date().toISOString(),
    trainerName,
    status: 'published',
  }
  const all = [quiz, ...loadAssessments()]
  localStorage.setItem(KEY, JSON.stringify(all))
  addNotification({
    role: 'maverick',
    title: 'New assessment published',
    body: `${trainerName} published "${quiz.title}" for batch ${batch}. Complete it from your dashboard.`,
    link: '/assessments',
    meta: { quizId: quiz.id, batch },
  })
  return quiz
}

export const getAssessmentsForBatch = (batchId) =>
  loadAssessments().filter((q) => q.batch === batchId && q.status === 'published')

export const completeAssessment = (quizId, score) => {
  const all = loadAssessments()
  const idx = all.findIndex((q) => q.id === quizId)
  if (idx === -1) return null
  all[idx] = { ...all[idx], completedAt: new Date().toISOString(), score }
  localStorage.setItem(KEY, JSON.stringify(all))
  return all[idx]
}
