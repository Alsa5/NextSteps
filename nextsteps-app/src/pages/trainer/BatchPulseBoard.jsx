import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import mockData from '../../data/mockData.json'
import { loadProgress } from '../../data/maverickProgress'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import { chartTooltipStyle } from '../../components/charts/chartTheme'

const moodColors = {
  great: BRAND_HEX.violet,
  good: BRAND_HEX.blue,
  okay: BRAND_HEX.amber,
  confused: BRAND_HEX.violet,
}
const moodEmojis = { great: '😄', good: '🙂', okay: '😐', confused: '😕' }

const aggregateMoods = (entries) => {
  const counts = { great: 0, good: 0, okay: 0, confused: 0 }
  entries.forEach((e) => {
    if (counts[e.mood] !== undefined) counts[e.mood] += 1
  })
  return counts
}

export default function BatchPulseBoard() {
  const session = useMemo(
    () => [...mockData.sessions].reverse().find((s) => s.status === 'completed') || mockData.sessions[1],
    [],
  )
  const livePulse = loadProgress().pulseSubmissions || []
  const mockPulse = mockData.feedbackPulse.filter((f) => f.sessionId === session.id)
  const allPulse = [...livePulse.map((p) => ({
    id: p.id,
    mood: p.mood,
    clarity: p.clarity,
    pace: p.pace,
    openText: p.openText,
    maverickName: p.maverickName,
  })), ...mockPulse.map((f) => {
    const mav = mockData.mavericks.find((m) => m.id === f.maverickId)
    return { ...f, maverickName: mav?.name }
  })]

  const moodDistribution = aggregateMoods(allPulse)
  const moodData = Object.entries(moodDistribution).map(([key, val]) => ({
    name: key, value: val, emoji: moodEmojis[key],
  })).filter((m) => m.value > 0)

  const avgClarity = allPulse.length
    ? (allPulse.reduce((s, p) => s + (p.clarity || 0), 0) / allPulse.length).toFixed(1)
    : session.avgClarity
  const avgPace = allPulse.length
    ? (allPulse.reduce((s, p) => s + (p.pace || 0), 0) / allPulse.length).toFixed(1)
    : session.avgPace
  const feedbackPct = Math.min(100, Math.round((allPulse.length / Math.max(session.attendanceCount || 12, 1)) * 100))

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
            <span className="tag tag-blue">👥 {allPulse.length} responses</span>
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
          <div className="card-title" style={{ marginBottom: 16 }}>💬 Latest responses</div>
          <p style={{ fontSize: 13, color: 'var(--base-text-secondary)' }}>
            {allPulse.length} total · includes live submissions from this browser session
          </p>
        </AppMagicCard>
      </div>

      <AppMagicCard className="card">
        <div className="card-header">
          <div className="card-title">📝 Individual Pulse Responses</div>
          <span className="tag tag-violet">{allPulse.length} responses</span>
        </div>
        <div className="flex flex-col gap-12">
          {allPulse.length === 0 ? (
            <p className="text-sm text-secondary">Waiting for Maverick pulse submissions…</p>
          ) : allPulse.map(fb => (
            <div key={fb.id} style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--base-surface)' }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-8">
                  <span style={{ fontSize: 20 }}>{moodEmojis[fb.mood]}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{fb.maverickName || 'Maverick'}</span>
                </div>
                <div className="flex gap-8">
                  <span className="tag tag-violet">Clarity: {fb.clarity}/5</span>
                  <span className="tag tag-blue">Pace: {fb.pace}/5</span>
                </div>
              </div>
              {fb.openText && <p style={{ fontSize: 13, color: 'var(--base-text-secondary)', fontStyle: 'italic' }}>"{fb.openText}"</p>}
            </div>
          ))}
        </div>
      </AppMagicCard>
    </motion.div>
  )
}
