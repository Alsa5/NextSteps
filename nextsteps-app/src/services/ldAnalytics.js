import mockData from '../data/mockData.json'
import { loadBatches, loadTrainees, getUnassignedTrainees } from '../data/ldTraineeStore'

const CURRICULUM_INSIGHTS = [
  {
    module: 'Java OOP — Inheritance',
    recommendation: 'Split into two sessions; confusion spikes in 4 batches during abstract classes.',
    confidence: 88,
    status: 'pending',
  },
  {
    module: 'SQL Joins',
    recommendation: 'Add hands-on lab before assessment; pacing flagged in pulse feedback.',
    confidence: 76,
    status: 'approved',
  },
  {
    module: 'AWS Basics',
    recommendation: 'Replace lecture with sandbox lab — engagement 22% below cohort average.',
    confidence: 71,
    status: 'pending',
  },
  {
    module: 'REST API Design',
    recommendation: 'Strong completion rates; extend as capstone project template.',
    confidence: 92,
    status: 'approved',
  },
]

export const getCurriculumInsights = () =>
  mockData.curriculumInsights?.length ? mockData.curriculumInsights : CURRICULUM_INSIGHTS

export const getEffectivenessData = () => {
  if (mockData.effectivenessData?.length) return mockData.effectivenessData

  const batches = loadBatches()
  const mavericks = mockData.mavericks

  return batches.map((b) => {
    const batchMavs = mavericks.filter((m) => m.batch === b.id)
    const avgReadiness = batchMavs.length
      ? Math.round(batchMavs.reduce((s, m) => s + (m.readinessScore || 0), 0) / batchMavs.length)
      : b.avgReadiness || 0
    const feedback = b.feedbackCompletion || 0
    const managerRating =
      avgReadiness >= 80 ? 4.6 : avgReadiness >= 70 ? 4.1 : avgReadiness >= 55 ? 3.4 : 2.8
    const projectSuccess = Math.min(
      95,
      Math.round(avgReadiness * 0.72 + feedback * 0.18 + (b.phase || 0) * 3),
    )
    return {
      batch: b.id,
      readinessScore: avgReadiness,
      managerRating: b.phase >= 2 ? managerRating : null,
      projectSuccess: b.phase >= 2 ? projectSuccess : null,
    }
  })
}

export const getOpsDashboardMetrics = () => {
  const batches = loadBatches()
  const trainees = loadTrainees()
  const mavericks = mockData.mavericks
  const activeBatches = batches.filter((b) => b.status === 'active' || !b.status || b.phase > 0)
  const formingBatches = batches.filter((b) => b.status === 'forming')
  const unassigned = getUnassignedTrainees(trainees)
  const atRisk = mavericks.filter((m) => m.riskFlag)
  const withFeedback = activeBatches.filter((b) => b.feedbackCompletion > 0)
  const avgFeedback = withFeedback.length
    ? Math.round(withFeedback.reduce((s, b) => s + b.feedbackCompletion, 0) / withFeedback.length)
    : 0

  const batchChartData = activeBatches.map((b) => {
    const batchMavs = mavericks.filter((m) => m.batch === b.id)
    const readiness = batchMavs.length
      ? Math.round(batchMavs.reduce((s, m) => s + (m.readinessScore || 0), 0) / batchMavs.length)
      : b.avgReadiness || 0
    return {
      id: b.id,
      name: b.id.replace(/^B-\d+-/, 'B'),
      readiness,
      feedback: b.feedbackCompletion || 0,
      mavericks: b.maverickCount || batchMavs.length,
      health: b.health || 'green',
      track: b.track,
    }
  })

  const trackDistribution = ['GET', 'PGET', 'STEP', 'LEAP'].map((track) => ({
    track,
    count: trainees.filter((t) => t.track === track).length,
  }))

  const queueByTrack = ['GET', 'PGET', 'STEP', 'LEAP'].map((track) => ({
    track,
    count: unassigned.filter((t) => t.track === track).length,
  }))

  return {
    totalMavericks: mavericks.length,
    totalTrainees: trainees.length,
    activeBatchCount: activeBatches.length,
    formingBatchCount: formingBatches.length,
    unassignedCount: unassigned.length,
    atRiskCount: atRisk.length,
    avgFeedback,
    batches: activeBatches,
    formingBatches,
    batchChartData,
    trackDistribution,
    queueByTrack,
    atRiskMavericks: atRisk,
    topPerformers: [...mavericks]
      .filter((m) => m.readinessScore >= 70)
      .sort((a, b) => b.readinessScore - a.readinessScore)
      .slice(0, 10),
  }
}

export const getReportData = () => {
  const metrics = getOpsDashboardMetrics()
  const effectiveness = getEffectivenessData().filter((d) => d.projectSuccess != null)
  const insights = getCurriculumInsights()

  return {
    generatedAt: new Date().toISOString(),
    quarter: 'Q1 2026',
    batches: metrics.batches.map((b) => ({
      id: b.id,
      name: b.name,
      mavericks: b.maverickCount,
      avgReadiness: b.avgReadiness,
      feedbackCompletion: b.feedbackCompletion,
      health: b.health,
      track: b.track,
    })),
    atRisk: metrics.atRiskMavericks.map((m) => ({
      name: m.name,
      batch: m.batch,
      readiness: m.readinessScore,
      sentiment: m.sentiment,
    })),
    topPerformers: metrics.topPerformers.map((m) => ({
      name: m.name,
      batch: m.batch,
      readiness: m.readinessScore,
      xp: m.xp,
    })),
    effectiveness,
    curriculumHealth: insights,
    summary: {
      totalMavericks: metrics.totalMavericks,
      activeBatches: metrics.activeBatchCount,
      avgFeedback: metrics.avgFeedback,
      atRiskCount: metrics.atRiskCount,
      queueCount: metrics.unassignedCount,
    },
  }
}

export const getFeedbackTrendByMonth = (records) => {
  const map = {}
  records.forEach((r) => {
    const month = r.date?.slice(0, 7) || 'unknown'
    if (!map[month]) map[month] = { month, count: 0, totalRating: 0 }
    map[month].count += 1
    map[month].totalRating += r.ratings?.overall ?? r.ratings?.trainerEffectiveness ?? 0
  })
  return Object.values(map)
    .map((m) => ({ ...m, avgRating: +(m.totalRating / m.count).toFixed(2) }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export const getFeedbackByBatch = (records) => {
  const map = {}
  records.forEach((r) => {
    if (!map[r.batch]) map[r.batch] = { batch: r.batch, count: 0, total: 0, flags: 0 }
    map[r.batch].count += 1
    map[r.batch].total += r.ratings?.overall ?? r.ratings?.trainerEffectiveness ?? 0
    if (r.flag) map[r.batch].flags += 1
  })
  return Object.values(map).map((b) => ({
    batch: b.batch,
    count: b.count,
    avgRating: +(b.total / b.count).toFixed(2),
    flags: b.flags,
  }))
}
