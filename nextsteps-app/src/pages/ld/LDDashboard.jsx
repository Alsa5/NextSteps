import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Users, BarChart3, AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import { getOpsDashboardMetrics, getCurriculumInsights } from '../../services/ldAnalytics'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import LDOpsThreeCharts from '../../components/ld/LDOpsThreeCharts'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import { animatedBarProps, animatedLineProps, chartAxisStroke, chartGridStroke, chartTooltipStyle } from '../../components/charts/chartTheme'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const PIE_COLORS = [BRAND_HEX.violet, BRAND_HEX.blue, '#f7c948', '#22c55e']
const chartTooltip = chartTooltipStyle
const gridStroke = chartGridStroke

export default function LDDashboard() {
  const metrics = getOpsDashboardMetrics()
  const curriculumInsights = getCurriculumInsights()
  const [sonicNominated, setSonicNominated] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nextsteps_sonic_nominations_v1') || '[]') } catch { return [] }
  })

  const trendData = metrics.batchChartData.map((b) => ({
    name: b.name,
    readiness: b.readiness,
    feedback: b.feedback,
  }))

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="ld"
          title="Constellation Archive"
          subtitle="Batch lifecycle, curriculum copilot, and cross-batch analytics"
        />
      </motion.div>

      <motion.div variants={item} className="grid-4" style={{ marginBottom: 24 }}>
        <AppMagicCard className="stat-card">
          <div className="stat-icon violet"><Users size={22} /></div>
          <div>
            <div className="stat-value">{metrics.totalMavericks}</div>
            <div className="stat-label">Total Mavericks</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon emerald"><CheckCircle size={22} /></div>
          <div>
            <div className="stat-value">{metrics.activeBatchCount}</div>
            <div className="stat-label">Active Batches</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon blue"><BarChart3 size={22} /></div>
          <div>
            <div className="stat-value">{metrics.avgFeedback}%</div>
            <div className="stat-label">Avg Feedback Rate</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon coral"><AlertTriangle size={22} /></div>
          <div>
            <div className="stat-value">{metrics.atRiskCount}</div>
            <div className="stat-label">At-Risk Mavericks</div>
          </div>
        </AppMagicCard>
      </motion.div>

      {metrics.formingBatchCount > 0 && (
        <motion.div variants={item} style={{ marginBottom: 24 }}>
          <AppMagicCard className="card highlight-card-warm">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{metrics.formingBatchCount} batch(es) still forming</div>
                <div className="text-sm text-secondary">Launch from Recruitment Queue when seats are filled.</div>
              </div>
              <Link to="/recruitment-queue" className="btn btn-primary">Launch batches</Link>
            </div>
          </AppMagicCard>
        </motion.div>
      )}

      {metrics.unassignedCount > 0 && (
        <motion.div variants={item} style={{ marginBottom: 24 }}>
          <AppMagicCard className="card highlight-card-lavender">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="stat-icon amber"><ClipboardList size={22} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{metrics.unassignedCount} recruits awaiting batch assignment</div>
                  <div className="text-sm text-secondary">Assign to an existing cohort or create a new training batch.</div>
                </div>
              </div>
              <Link to="/recruitment-queue" className="btn btn-primary">Open Recruitment Queue</Link>
            </div>
          </AppMagicCard>
        </motion.div>
      )}

      <motion.div variants={item} style={{ marginBottom: 24 }}>
        <AppMagicCard className="card">
          <div className="card-header">
            <div className="card-title">Live 3D Ops Visualization</div>
            <span className="tag tag-violet">Three.js · Real data</span>
          </div>
          <LDOpsThreeCharts batchData={metrics.batchChartData} trackData={metrics.trackDistribution} />
        </AppMagicCard>
      </motion.div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <motion.div variants={item}>
          <AppMagicCard className="card">
            <div className="card-header">
              <div className="card-title">Batch Readiness Trend</div>
            </div>
            <LiveChartContainer height={250} ariaLabel="Batch readiness trend">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" fontSize={12} stroke={chartAxisStroke} />
                <YAxis fontSize={11} stroke={chartAxisStroke} />
                <Tooltip contentStyle={chartTooltip} />
                <Legend />
                <Line type="monotone" dataKey="readiness" stroke={BRAND_HEX.violet} strokeWidth={2.5} dot={{ r: 4 }} name="Readiness" {...animatedLineProps} />
                <Line type="monotone" dataKey="feedback" stroke={BRAND_HEX.blue} strokeWidth={2.5} dot={{ r: 4 }} name="Feedback %" {...animatedLineProps} />
              </LineChart>
            </LiveChartContainer>
          </AppMagicCard>
        </motion.div>

        <motion.div variants={item}>
          <AppMagicCard className="card">
            <div className="card-header">
              <div className="card-title">Recruitment Queue by Track</div>
            </div>
            <LiveChartContainer height={250} ariaLabel="Recruitment queue by track">
              <PieChart>
                <Pie
                  data={metrics.queueByTrack.filter((t) => t.count > 0)}
                  dataKey="count"
                  nameKey="track"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  isAnimationActive
                  animationDuration={1200}
                  label={({ track, count }) => `${track}: ${count}`}
                >
                  {metrics.queueByTrack.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltip} />
              </PieChart>
            </LiveChartContainer>
          </AppMagicCard>
        </motion.div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <motion.div variants={item}>
          <AppMagicCard className="card">
            <div className="card-header">
              <div className="card-title">Batch Health Overview</div>
            </div>
            <LiveChartContainer height={250} ariaLabel="Batch health overview">
              <BarChart data={metrics.batchChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="name" fontSize={12} stroke={chartAxisStroke} />
                <YAxis fontSize={11} stroke={chartAxisStroke} />
                <Tooltip contentStyle={chartTooltip} />
                <Bar dataKey="readiness" fill={BRAND_HEX.violet} radius={[6, 6, 0, 0]} name="Readiness" {...animatedBarProps} />
                <Bar dataKey="feedback" fill={BRAND_HEX.blue} radius={[6, 6, 0, 0]} name="Feedback %" {...animatedBarProps} />
              </BarChart>
            </LiveChartContainer>
          </AppMagicCard>
        </motion.div>

        <motion.div variants={item}>
          <AppMagicCard className="card highlight-card-lavender">
            <div className="card-header">
              <div className="card-title">AI Insights</div>
              <span className="tag tag-violet">Azure AI</span>
            </div>
            <div className="flex flex-col gap-12">
              {curriculumInsights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{insight.module}</span>
                    <span className={`tag ${insight.status === 'approved' ? 'tag-green' : 'tag-amber'}`}>
                      {insight.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>{insight.recommendation}</p>
                  <div className="flex items-center gap-8 mt-8">
                    <span className="text-xs text-secondary">Confidence:</span>
                    <div className="progress-bar" style={{ width: 80, height: 4 }}>
                      <div className="progress-fill violet" style={{ width: `${insight.confidence}%` }} />
                    </div>
                    <span className="text-xs" style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>{insight.confidence}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </AppMagicCard>
        </motion.div>
      </div>

      <motion.div variants={item} data-welcome-spotlight="batch-table">
        <h2 className="font-display" style={{ fontSize: 20, marginBottom: 16 }}>All Batches</h2>
        <div className="grid-2">
          {metrics.batches.map((batch) => (
            <motion.div key={batch.id} whileHover={{ scale: 1.01 }}>
              <AppMagicCard className="card">
                <div className="flex items-center justify-between mb-16">
                  <div className="flex items-center gap-12">
                    <div className={`rag-dot ${batch.health}`} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{batch.name}</div>
                      <div className="text-sm text-secondary">Phase {batch.phase} · {batch.track}</div>
                    </div>
                  </div>
                  <span className={`tag ${batch.health === 'green' ? 'tag-green' : batch.health === 'amber' ? 'tag-amber' : 'tag-red'}`}>
                    {batch.health.toUpperCase()}
                  </span>
                </div>
                <div className="grid-3" style={{ gap: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{batch.maverickCount}</div>
                    <div className="text-xs text-secondary">Mavericks</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: batch.feedbackCompletion >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {batch.feedbackCompletion}%
                    </div>
                    <div className="text-xs text-secondary">Feedback</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-violet)' }}>
                      {batch.avgReadiness || '—'}
                    </div>
                    <div className="text-xs text-secondary">Readiness</div>
                  </div>
                </div>
                {batch.trainer && (
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--base-text-secondary)' }}>
                    Trainer: {batch.trainer}
                  </div>
                )}
              </AppMagicCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <AppMagicCard className="card mt-24">
          <div className="card-header">
            <div className="card-title">Top Performers (Top 10%)</div>
            <span className="tag tag-amber">AI-Ranked</span>
          </div>
          <table className="data-table">
            <thead>
              <tr><th>Rank</th><th>Maverick</th><th>Batch</th><th>Readiness</th><th>Quiz Avg</th><th>XP</th><th>Nomination</th></tr>
            </thead>
            <tbody>
              {metrics.topPerformers.map((m, i) => (
                <tr key={m.id}>
                  <td><span style={{ fontWeight: 800 }}>#{i + 1}</span></td>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td><span className="tag tag-violet">{m.batch}</span></td>
                  <td><span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{m.readinessScore}</span></td>
                  <td>{m.quizAvg}%</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>{m.xp.toLocaleString()}</td>
                  <td>
                    {sonicNominated.includes(m.id) ? (
                      <span className="tag tag-green">Nominated ✓</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const next = [...sonicNominated, m.id]
                          setSonicNominated(next)
                          localStorage.setItem('nextsteps_sonic_nominations_v1', JSON.stringify(next))
                          toast.success(`${m.name} nominated for SONIC review`)
                        }}
                      >
                        Nominate SONIC
                      </button>
                    )}
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
