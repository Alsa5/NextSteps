import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import mockData from '../../data/mockData.json'
import AppMagicCard from '../../components/AppMagicCard'
import TrainerRankCard from '../../components/trainer/TrainerRankCard'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import ChartEmptyState from '../../components/charts/ChartEmptyState'
import { animatedLineProps, chartAxisStroke, chartColors, chartGridStroke, chartTooltipStyle } from '../../components/charts/chartTheme'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const RECENT_SESSION_LIMIT = 6

export default function TrainerDashboard() {
  const trainer = mockData.trainers[0]
  const batchSessions = mockData.sessions.filter(s => s.trainerId === 'tr-001')
  const completedSessions = batchSessions.filter(s => s.status === 'completed')
  const recentSessions = [...batchSessions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, RECENT_SESSION_LIMIT)
  const batchMavericks = mockData.mavericks.filter(m => m.batch === 'B-2025-13')
  const atRisk = batchMavericks.filter(m => m.riskFlag)

  const clarityData = completedSessions.map(s => ({
    name: s.title.split(' ').slice(0, 2).join(' '),
    clarity: s.avgClarity,
    pace: s.avgPace,
    feedback: s.feedbackCompletion
  }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="trainer-dashboard">
      <motion.div variants={item}>
        <MetaversePageHero
          role="trainer"
          title="Pulse Observatory"
          subtitle={`${trainer.name} · ${trainer.specialization} · live batch pulse & session intelligence`}
        />
      </motion.div>

      <motion.div variants={item} className="grid-3" style={{ marginBottom: 24 }}>
        <Link to="/batch-pulse" style={{ textDecoration: 'none', color: 'inherit' }}>
          <AppMagicCard className="card">
            <div className="card-title">📡 Batch Pulse Board</div>
            <p className="text-sm text-secondary" style={{ margin: '8px 0 0' }}>Live mood and clarity from Maverick pulse feedback.</p>
          </AppMagicCard>
        </Link>
        <Link to="/assessments" style={{ textDecoration: 'none', color: 'inherit' }}>
          <AppMagicCard className="card">
            <div className="card-title">✅ Assessments</div>
            <p className="text-sm text-secondary" style={{ margin: '8px 0 0' }}>Publish quizzes — Mavericks get notified instantly.</p>
          </AppMagicCard>
        </Link>
        <Link to="/session-analytics" style={{ textDecoration: 'none', color: 'inherit' }}>
          <AppMagicCard className="card">
            <div className="card-title">📊 Session Analytics</div>
            <p className="text-sm text-secondary" style={{ margin: '8px 0 0' }}>Trends, spikes, and transcripts.</p>
          </AppMagicCard>
        </Link>
      </motion.div>

      <motion.div variants={item} style={{ marginBottom: 24 }}>
        <TrainerRankCard />
      </motion.div>

      <motion.div variants={item} className="grid-4" style={{ marginBottom: 24 }}>
        <AppMagicCard className="stat-card">
          <div className="stat-icon violet"><Users size={22} /></div>
          <div>
            <div className="stat-value">{batchMavericks.length}</div>
            <div className="stat-label">Mavericks in Batch</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon emerald"><CheckCircle size={22} /></div>
          <div>
            <div className="stat-value">{completedSessions.length}</div>
            <div className="stat-label">Sessions Delivered</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon blue"><BarChart3 size={22} /></div>
          <div>
            <div className="stat-value">{trainer.avgClarity}</div>
            <div className="stat-label">Avg Clarity Score</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon coral"><AlertTriangle size={22} /></div>
          <div>
            <div className="stat-value">{atRisk.length}</div>
            <div className="stat-label">At-Risk Mavericks</div>
          </div>
        </AppMagicCard>
      </motion.div>

      <motion.div variants={item} style={{ marginBottom: 24 }}>
        <AppMagicCard className="card">
          <div className="card-header">
            <div className="card-title">📊 Session Clarity & Pace</div>
          </div>
          {clarityData.length === 0 ? (
            <div className="chart-surface" style={{ height: 280 }}>
              <ChartEmptyState message="No completed sessions yet — deliver a session to see clarity and pace trends." />
            </div>
          ) : (
            <LiveChartContainer height={280} ariaLabel="Session clarity and pace trend">
              <LineChart data={clarityData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                <XAxis dataKey="name" fontSize={11} stroke={chartAxisStroke} interval={0} angle={-20} textAnchor="end" height={56} />
                <YAxis yAxisId="score" domain={[0, 5]} fontSize={11} stroke={chartAxisStroke} />
                <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} fontSize={11} stroke={chartAxisStroke} hide />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Line yAxisId="score" type="monotone" dataKey="clarity" stroke={chartColors.violet} strokeWidth={2.5} dot={{ r: 4 }} name="Clarity" {...animatedLineProps} />
                <Line yAxisId="score" type="monotone" dataKey="pace" stroke={chartColors.blue} strokeWidth={2.5} dot={{ r: 4 }} name="Pace" {...animatedLineProps} />
                <Line yAxisId="pct" type="monotone" dataKey="feedback" stroke={chartColors.amber} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} name="Feedback %" {...animatedLineProps} />
              </LineChart>
            </LiveChartContainer>
          )}
        </AppMagicCard>
      </motion.div>

      <motion.div variants={item} style={{ marginBottom: 24 }}>
        <AppMagicCard className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="card-title">📅 Recent Sessions</div>
            {batchSessions.length > RECENT_SESSION_LIMIT && (
              <Link to="/session-analytics" className="text-sm" style={{ color: 'var(--accent-violet)', textDecoration: 'none', fontWeight: 600 }}>
                View all {batchSessions.length} →
              </Link>
            )}
          </div>
          <div className="trainer-session-grid">
            {recentSessions.map(session => (
              <div
                key={session.id}
                className="trainer-session-card"
                style={{
                  background: session.status === 'upcoming' ? 'var(--secondary-sky)' : 'var(--base-surface)',
                  border: session.status === 'upcoming' ? '1.5px solid var(--secondary-sky-deep)' : '1px solid var(--base-border)',
                }}
              >
                <div className="flex items-center justify-between gap-8">
                  <div className="min-w-0">
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{session.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>{session.date} · {session.time}</div>
                  </div>
                  <span className={`tag ${session.status === 'upcoming' ? 'tag-blue' : 'tag-green'}`} style={{ flexShrink: 0 }}>
                    {session.status === 'upcoming' ? 'Upcoming' : 'Done'}
                  </span>
                </div>
                {session.status === 'completed' && (
                  <div className="flex items-center flex-wrap gap-8" style={{ marginTop: 8 }}>
                    <span className="text-xs text-secondary">Clarity {session.avgClarity}/5</span>
                    <span className="text-xs text-secondary">Feedback {session.feedbackCompletion}%</span>
                    <span className="text-xs text-secondary">Attendance {session.attendanceRate}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AppMagicCard>
      </motion.div>

      {atRisk.length > 0 && (
        <motion.div variants={item} style={{ marginBottom: 24 }}>
          <AppMagicCard className="card" style={{ borderColor: 'var(--accent-coral)', borderWidth: 2 }}>
            <div className="card-header">
              <div className="flex items-center gap-8">
                <AlertTriangle size={18} color="var(--accent-coral)" />
                <div className="card-title" style={{ color: 'var(--accent-coral)' }}>🚩 Struggling Mavericks</div>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Maverick</th><th>Attendance</th><th>Feedback Rate</th><th>Quiz Avg</th><th>Sentiment</th><th>Action</th></tr>
              </thead>
              <tbody>
                {atRisk.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td><span className={m.attendance < 80 ? 'tag tag-red' : 'tag tag-green'}>{m.attendance}%</span></td>
                    <td><span className={m.feedbackRate < 70 ? 'tag tag-red' : 'tag tag-amber'}>{m.feedbackRate}%</span></td>
                    <td>{m.quizAvg}%</td>
                    <td><span className="tag tag-red">😟 {m.sentiment}</span></td>
                    <td><button type="button" className="btn btn-sm btn-secondary">Escalate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AppMagicCard>
        </motion.div>
      )}

      <motion.div variants={item}>
        <AppMagicCard className="card">
          <div className="card-header">
            <div className="card-title">👥 Batch 13 — Maverick Overview</div>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Maverick</th><th>Track</th><th>XP</th><th>Readiness</th><th>Attendance</th><th>Quiz Avg</th><th>Status</th></tr>
            </thead>
            <tbody>
              {batchMavericks.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td><span className="tag tag-violet">{m.track}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>{m.xp.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-8">
                      <div className="progress-bar" style={{ width: 60, height: 6 }}>
                        <div className={`progress-fill ${m.readinessScore >= 70 ? 'emerald' : 'coral'}`} style={{ width: `${m.readinessScore}%` }} />
                      </div>
                      <span className="text-sm">{m.readinessScore}</span>
                    </div>
                  </td>
                  <td>{m.attendance}%</td>
                  <td>{m.quizAvg}%</td>
                  <td>
                    {m.riskFlag ? <span className="tag tag-red">⚠️ At Risk</span> : <span className="tag tag-green">✅ On Track</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppMagicCard>
      </motion.div>
    </motion.div>
  )
}
