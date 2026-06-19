import React from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts'
import { getEffectivenessData } from '../../services/ldAnalytics'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import { animatedBarProps, animatedLineProps, chartAxisStroke, chartGridStroke, chartTooltipStyle } from '../../components/charts/chartTheme'

const gridStroke = chartGridStroke
const chartTooltip = chartTooltipStyle

export default function EffectivenessLoop() {
  const data = getEffectivenessData().filter((d) => d.managerRating !== null)

  const scatterData = data.map((d) => ({
    readiness: d.readinessScore,
    projectSuccess: d.projectSuccess,
    batch: d.batch,
  }))

  const lineData = data.map((d) => ({
    name: d.batch.replace(/^B-\d+-/, 'B'),
    readiness: d.readinessScore,
    projectSuccess: d.projectSuccess,
    managerRating: Math.round(d.managerRating * 20),
  }))

  const barData = data.map((d) => ({
    name: d.batch.replace(/^B-\d+-/, 'B'),
    readiness: d.readinessScore,
    projectSuccess: d.projectSuccess,
    managerRating: Math.round(d.managerRating * 20),
  }))

  const best = [...data].sort((a, b) => (b.projectSuccess || 0) - (a.projectSuccess || 0))[0]
  const worst = [...data].sort((a, b) => (a.projectSuccess || 0) - (b.projectSuccess || 0))[0]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <MetaversePageHero
        role="ld"
        title="Training Effectiveness Loop"
        subtitle="Connecting post-deployment Manager ratings back to training data (aggregate, privacy-centric)"
      />

      <motion.div
        className="card highlight-card-mint"
        style={{ marginBottom: 24 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-16">
          <div style={{ fontSize: 48 }}>🔄</div>
          <div>
            <h3 className="font-display" style={{ marginBottom: 8 }}>AI Effectiveness Insight</h3>
            <p style={{ fontSize: 14, color: 'var(--base-text-secondary)', lineHeight: 1.6 }}>
              {best && (
                <>
                  <strong>{best.batch}</strong> ({best.readinessScore}% readiness) achieved <strong>{best.projectSuccess}% project success</strong> — highest correlation in the cohort.
                </>
              )}
              {worst && worst.batch !== best?.batch && (
                <>
                  {' '}<strong>{worst.batch}</strong> ({worst.readinessScore}% readiness) had {worst.projectSuccess}% project success — correlated with lower feedback completion and rushed modules.
                </>
              )}
            </p>
          </div>
        </div>
      </motion.div>

      <AppMagicCard className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Readiness → Project Success Trend</div>
        <LiveChartContainer height={280} ariaLabel="Readiness to project success trend">
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="name" fontSize={12} stroke={chartAxisStroke} />
            <YAxis fontSize={11} stroke={chartAxisStroke} domain={[0, 100]} />
            <Tooltip contentStyle={chartTooltip} />
            <Legend />
            <Line type="monotone" dataKey="readiness" stroke={BRAND_HEX.violet} strokeWidth={2.5} dot={{ r: 5 }} activeDot={{ r: 7 }} name="Readiness" {...animatedLineProps} />
            <Line type="monotone" dataKey="projectSuccess" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 5 }} name="Project Success %" {...animatedLineProps} />
            <Line type="monotone" dataKey="managerRating" stroke="#f7c948" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4 }} name="Manager Rating (scaled)" {...animatedLineProps} />
          </LineChart>
        </LiveChartContainer>
      </AppMagicCard>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Readiness vs Project Success</div>
          <LiveChartContainer height={300} ariaLabel="Readiness versus project success scatter">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis type="number" dataKey="readiness" name="Readiness" fontSize={11} stroke={chartAxisStroke} domain={[40, 100]} label={{ value: 'Training Readiness', position: 'bottom', fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
              <YAxis type="number" dataKey="projectSuccess" name="Project Success" fontSize={11} stroke={chartAxisStroke} domain={[40, 100]} label={{ value: 'Project Success %', angle: -90, position: 'left', fontSize: 12, fill: 'rgba(255,255,255,0.5)' }} />
              <Tooltip contentStyle={chartTooltip} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill={BRAND_HEX.violet} fillOpacity={0.85} isAnimationActive animationDuration={1200} />
            </ScatterChart>
          </LiveChartContainer>
        </AppMagicCard>

        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Batch Performance Comparison</div>
          <LiveChartContainer height={300} ariaLabel="Batch performance comparison">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" fontSize={12} stroke={chartAxisStroke} />
              <YAxis fontSize={11} stroke={chartAxisStroke} />
              <Tooltip contentStyle={chartTooltip} />
              <Legend />
              <Bar dataKey="readiness" fill={BRAND_HEX.violet} radius={[6, 6, 0, 0]} name="Readiness" {...animatedBarProps} />
              <Bar dataKey="projectSuccess" fill="#22c55e" radius={[6, 6, 0, 0]} name="Project Success %" {...animatedBarProps} />
              <Bar dataKey="managerRating" fill="#f7c948" radius={[6, 6, 0, 0]} name="Manager Rating (scaled)" {...animatedBarProps} />
            </BarChart>
          </LiveChartContainer>
        </AppMagicCard>
      </div>

      <AppMagicCard className="card">
        <div className="card-header">
          <div className="card-title">Effectiveness Data</div>
          <span className="tag tag-violet">Live from roster</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Batch</th><th>Readiness Score</th><th>Manager Rating</th><th>Project Success</th><th>Correlation</th></tr>
          </thead>
          <tbody>
            {getEffectivenessData().map((d) => (
              <tr key={d.batch}>
                <td style={{ fontWeight: 600 }}>{d.batch}</td>
                <td>
                  <div className="flex items-center gap-8">
                    <div className="progress-bar" style={{ width: 80, height: 6 }}>
                      <div className="progress-fill violet" style={{ width: `${d.readinessScore}%` }} />
                    </div>
                    <span style={{ fontWeight: 700 }}>{d.readinessScore}</span>
                  </div>
                </td>
                <td>{d.managerRating ? `${d.managerRating}/5 ⭐` : '—'}</td>
                <td>{d.projectSuccess ? <span style={{ fontWeight: 700, color: d.projectSuccess >= 70 ? 'var(--accent-emerald)' : 'var(--accent-coral)' }}>{d.projectSuccess}%</span> : '—'}</td>
                <td>
                  {d.projectSuccess ? (
                    <span className={`tag ${d.projectSuccess >= 70 ? 'tag-green' : 'tag-red'}`}>
                      {d.projectSuccess >= 70 ? 'Strong' : 'Weak'}
                    </span>
                  ) : <span className="tag" style={{ background: 'var(--base-surface)' }}>Pending</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AppMagicCard>
    </motion.div>
  )
}
