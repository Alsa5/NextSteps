import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'
import mockData from '../../data/mockData.json'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import ChartEmptyState from '../../components/charts/ChartEmptyState'
import { animatedAreaProps, chartAxisStroke, chartGridStroke, chartTooltipStyle } from '../../components/charts/chartTheme'
import { fetchSessionAnalytics, fetchTrainerSessions } from '../../services/sessionApi'

export default function SessionAnalytics() {
  const trainer = mockData.trainers[0]
  const [apiSessions, setApiSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    fetchTrainerSessions()
      .then(({ sessions }) => setApiSessions(sessions))
      .catch(() => setApiSessions([]))
  }, [])

  const mockSessions = mockData.sessions.filter((s) => s.trainerId === 'tr-001' && s.status === 'completed')
  const sessions = apiSessions.length > 0 ? apiSessions : mockSessions

  const completed = sessions.filter((s) => s.status === 'completed')
  const activeId = selectedId ?? completed[0]?.id ?? sessions[0]?.id

  useEffect(() => {
    if (!activeId) return
    fetchSessionAnalytics(activeId)
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
  }, [activeId])

  const trendData = completed.map((s) => ({
    session: (s.title ?? 'Session').split(' ').slice(0, 2).join(' '),
    clarity: s.avgClarity,
    pace: s.avgPace,
    feedback: s.feedbackCompletion,
    attendance: s.attendanceRate,
  }))

  const confusionData = analytics?.confusionSpikes ?? mockData.transcripts[0]?.confusionTimestamps ?? []
  const aiAnalysis = analytics?.aiAnalysis
  const summaryPoints = aiAnalysis?.summary?.length ? aiAnalysis.summary : mockData.transcripts[0]?.summary ?? []
  const keyTerms = aiAnalysis?.keyTerms?.length ? aiAnalysis.keyTerms : analytics?.keyTerms ?? mockData.transcripts[0]?.keyTerms ?? []

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>📊 My Session Analytics</h1>
        <p>Track teaching effectiveness — powered by GPT session transcript analysis</p>
      </div>

      {sessions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`btn-secondary ${activeId === s.id ? 'active' : ''}`}
              onClick={() => setSelectedId(s.id)}
              style={{
                borderColor: activeId === s.id ? 'var(--brand-violet)' : undefined,
                background: activeId === s.id ? 'rgba(123,92,245,0.15)' : undefined,
              }}
            >
              {s.title ?? s.id}
            </button>
          ))}
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <AppMagicCard className="stat-card">
          <div className="stat-icon violet">📊</div>
          <div>
            <div className="stat-value">{analytics?.clarity?.avg?.toFixed(1) ?? trainer.avgClarity}</div>
            <div className="stat-label">Avg Clarity</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon emerald">⭐</div>
          <div>
            <div className="stat-value">{aiAnalysis?.clarityScore ?? '—'}</div>
            <div className="stat-label">AI Clarity Score</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div>
            <div className="stat-value">{sessions.length}</div>
            <div className="stat-label">Sessions</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon amber">{aiAnalysis?.paceRating ?? '📈'}</div>
          <div>
            <div className="stat-value" style={{ fontSize: 18 }}>{aiAnalysis?.paceRating ?? '—'}</div>
            <div className="stat-label">AI Pace Rating</div>
          </div>
        </AppMagicCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>📈 Clarity & Feedback Trend</div>
          {trendData.length === 0 ? (
            <div className="chart-surface" style={{ height: 280 }}>
              <ChartEmptyState message="No completed sessions yet." />
            </div>
          ) : (
            <LiveChartContainer height={280} ariaLabel="Clarity and feedback trend">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorClarity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_HEX.violet} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRAND_HEX.violet} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFeedback" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_HEX.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRAND_HEX.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="session" fontSize={11} stroke={chartAxisStroke} />
                <YAxis yAxisId="score" domain={[0, 5]} fontSize={11} stroke={chartAxisStroke} />
                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} fontSize={11} stroke={chartAxisStroke} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area yAxisId="score" type="monotone" dataKey="clarity" stroke={BRAND_HEX.violet} fill="url(#colorClarity)" strokeWidth={2} name="Clarity (0-5)" {...animatedAreaProps} />
                <Area yAxisId="pct" type="monotone" dataKey="feedback" stroke={BRAND_HEX.blue} fill="url(#colorFeedback)" strokeWidth={2} name="Feedback %" {...animatedAreaProps} />
              </AreaChart>
            </LiveChartContainer>
          )}
        </AppMagicCard>

        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🔍 Confusion Spike Detection</div>
          <p className="text-sm text-secondary mb-16">GPT-detected moments where batch clarity dipped</p>
          <div className="flex flex-col gap-16">
            {confusionData.length === 0 ? (
              <ChartEmptyState message="No confusion spikes in this session yet." />
            ) : (
              confusionData.map((spike, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    padding: '16px', borderRadius: 'var(--radius-md)',
                    background: 'var(--secondary-rose)', border: '1px solid var(--secondary-rose-deep)',
                  }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <span style={{ fontWeight: 700, color: 'var(--accent-coral)' }}>⏱️ {spike.time}</span>
                    <span className="tag tag-red">Clarity: {spike.clarityDip}/5</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{spike.topic}</div>
                </motion.div>
              ))
            )}
          </div>
        </AppMagicCard>
      </div>

      <AppMagicCard className="card">
        <div className="card-header">
          <div className="card-title">📄 GPT Session Analysis</div>
          <span className="tag tag-violet">{aiAnalysis?.model ?? 'Azure OpenAI'}</span>
        </div>
        {aiAnalysis?.trainerInsights && (
          <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--base-text-secondary)' }}>
            {aiAnalysis.trainerInsights}
          </p>
        )}
        <div className="flex flex-col gap-12">
          {summaryPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-12" style={{ padding: '8px 0' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--secondary-lavender)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: 'var(--accent-violet)', flexShrink: 0,
              }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 14 }}>{point}</span>
            </div>
          ))}
        </div>
        {aiAnalysis?.recommendations?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <strong style={{ fontSize: 13 }}>Recommendations</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {aiAnalysis.recommendations.map((r, i) => (
                <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{r}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex gap-8 mt-16" style={{ flexWrap: 'wrap' }}>
          <span className="text-sm text-secondary">Key Terms:</span>
          {keyTerms.map((term) => (
            <span key={term} className="tag tag-blue">{term}</span>
          ))}
        </div>
      </AppMagicCard>
    </motion.div>
  )
}
