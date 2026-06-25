import React, { useMemo, useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { AuthContext } from '../../context/AuthContext'
import mockData from '../../data/mockData.json'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import { chartTooltipStyle } from '../../components/charts/chartTheme'

const moodColors = {
  great: BRAND_HEX.violet,
  good: BRAND_HEX.blue,
  okay: BRAND_HEX.amber,
  confused: BRAND_HEX.coral,
}
const moodEmojis = { great: '😄', good: '🙂', okay: '😐', confused: '😕' }

export default function BatchPulseBoard() {
  const { user: currentUser } = useContext(AuthContext)
  const [feedbackData, setFeedbackData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const session = useMemo(
    () => [...mockData.sessions].reverse().find((s) => s.status === 'completed') || mockData.sessions[1],
    [],
  )

  // Load sanitized feedback data from API (trainer endpoint)
  useEffect(() => {
    const loadFeedbackData = async () => {
      try {
        console.log('=== LOADING TRAINER FEEDBACK ===')
        console.log('Session ID:', session.id)
        
        const response = await fetch(`/api/v1/session-feedback/trainer/${session.id}`, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
          }
        })

        if (!response.ok) {
          if (response.status === 403) {
            console.warn('Access denied - may not be trainer role')
            return
          }
          throw new Error('Failed to load feedback data')
        }

        const data = await response.json()
        console.log('✅ Received sanitized feedback:', data)
        setFeedbackData(data)
        
      } catch (error) {
        console.error('Feedback loading error:', error)
        // Fallback to empty state if API fails
        setFeedbackData({
          aggregateStats: {
            totalResponses: 0,
            moodDistribution: { great: 0, good: 0, okay: 0, confused: 0 },
            averageClarity: 0,
            averagePace: 0,
          },
          comments: [],
          privacy: 'trainer-aggregate-only',
          kAnonymityApplied: false,
          lowSampleSize: true,
        })
      } finally {
        setLoading(false)
      }
    }

    loadFeedbackData()
  }, [session.id])

  const moodColors = {
    great: BRAND_HEX.violet,
    good: BRAND_HEX.blue,
    okay: BRAND_HEX.amber,
    confused: BRAND_HEX.coral,
  }
  const moodEmojis = { great: '😄', good: '🙂', okay: '😐', confused: '😕' }

  // Convert mood distribution to chart data
  const moodData = feedbackData ? Object.entries(feedbackData.aggregateStats.moodDistribution)
    .map(([key, val]) => ({
      name: key, 
      value: val, 
      emoji: moodEmojis[key],
    }))
    .filter((m) => m.value > 0) : []

  const totalResponses = feedbackData?.aggregateStats.totalResponses || 0
  const avgClarity = feedbackData?.aggregateStats.averageClarity || session.avgClarity || 0
  const avgPace = feedbackData?.aggregateStats.averagePace || session.avgPace || 0
  const feedbackPct = Math.min(100, Math.round((totalResponses / Math.max(session.attendanceCount || 12, 1)) * 100))

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: 60 }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p>Loading feedback data...</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>📡 Live Batch Pulse Board</h1>
        <p>Real-time aggregate feedback from your latest completed session</p>
      </div>

      <AppMagicCard className="card highlight-card-lavender" style={{ marginBottom: 24 }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 style={{ fontSize: 20 }}>{session.title}</h3>
            <p className="text-sm text-secondary">{session.topic} · {session.date}</p>
          </div>
          <div className="flex gap-12">
            <span className="tag tag-green">✅ {feedbackPct}% feedback</span>
            <span className="tag tag-blue">👥 {totalResponses} responses</span>
            {feedbackData?.lowSampleSize && (
              <span className="tag tag-amber">⚠️ Low sample size</span>
            )}
          </div>
        </div>
      </AppMagicCard>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>😊 Mood Distribution</div>
          {moodData.length > 0 ? (
            <>
              <LiveChartContainer height={200} ariaLabel="Mood distribution">
                <PieChart>
                  <Pie data={moodData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" isAnimationActive animationDuration={1200}>
                    {moodData.map((entry, i) => (
                      <Cell key={i} fill={moodColors[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(val, name) => [`${val} Mavericks`, `${moodEmojis[name]} ${name}`]} />
                </PieChart>
              </LiveChartContainer>
              <div className="flex justify-between" style={{ padding: '0 8px' }}>
                {moodData.map(m => (
                  <div key={m.name} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20 }}>{m.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-secondary">No pulse responses yet — Mavericks submit via Pulse Feedback.</p>
          )}
        </AppMagicCard>

        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>📊 Clarity & Pace</div>
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm">Clarity</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: 'var(--accent-emerald)' }}>{avgClarity}/5</span>
            </div>
            <div className="progress-bar" style={{ height: 12 }}>
              <div className="progress-fill emerald" style={{ width: `${(Number(avgClarity) / 5) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm">Pace</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: 'var(--accent-blue)' }}>{avgPace}/5</span>
            </div>
            <div className="progress-bar" style={{ height: 12 }}>
              <div className="progress-fill violet" style={{ width: `${(Number(avgPace) / 5) * 100}%` }} />
            </div>
          </div>
        </AppMagicCard>

        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>💬 Anonymous Feedback</div>
          <p style={{ fontSize: 13, color: 'var(--base-text-secondary)' }}>
            {totalResponses} total responses
            {feedbackData?.lowSampleSize && ' • Individual comments hidden for privacy (< 5 responses)'}
          </p>
          {feedbackData?.kAnonymityApplied && feedbackData.comments.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {feedbackData.comments.map((comment, i) => (
                <div key={i} style={{ 
                  padding: '8px 12px', 
                  marginBottom: 8,
                  borderRadius: 'var(--radius-sm)', 
                  background: 'var(--base-surface)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--text-secondary)'
                }}>
                  "{comment}"
                </div>
              ))}
            </div>
          )}
          {feedbackData?.lowSampleSize && (
            <p style={{ fontSize: 12, color: 'var(--accent-amber)', marginTop: 8 }}>
              Individual feedback will appear when ≥5 responses are received
            </p>
          )}
        </AppMagicCard>
      </div>

      <AppMagicCard className="card">
        <div className="card-header">
          <div className="card-title">🔒 Privacy-Protected Results</div>
          <span className="tag tag-violet">{totalResponses} responses</span>
        </div>
        <div className="flex flex-col gap-12">
          {totalResponses === 0 ? (
            <p className="text-sm text-secondary">Waiting for Maverick pulse submissions…</p>
          ) : (
            <div style={{ 
              padding: '16px', 
              borderRadius: 'var(--radius-md)', 
              background: 'var(--accent-violet-muted)',
              border: '1px solid var(--accent-violet)'
            }}>
              <div className="flex items-center gap-8 mb-8">
                <span style={{ fontSize: 16 }}>🔒</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Individual Identity Protected</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                This view shows aggregate statistics only. Individual maverick responses are visible to L&D for trainer performance analysis, 
                but not displayed here to maintain privacy and prevent bias.
              </p>
              {feedbackData?.kAnonymityApplied && (
                <p style={{ fontSize: 12, color: 'var(--accent-emerald)', marginTop: 8 }}>
                  ✓ K-anonymity threshold met ({totalResponses} ≥ 5 responses)
                </p>
              )}
            </div>
          )}
        </div>
      </AppMagicCard>
    </motion.div>
  )
}
