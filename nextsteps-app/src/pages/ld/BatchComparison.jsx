import React from 'react'
import { motion } from 'framer-motion'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts'
import mockData from '../../data/mockData.json'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'
import LiveChartContainer from '../../components/charts/LiveChartContainer'
import { chartTooltipStyle } from '../../components/charts/chartTheme'

export default function BatchComparison() {
  const batches = mockData.batches.filter(b => b.feedbackCompletion > 0)

  const radarData = [
    { metric: 'Readiness', B13: 71.6, B14: 83.5, B15: 46 },
    { metric: 'Feedback', B13: 83, B14: 89, B15: 65 },
    { metric: 'Quiz Avg', B13: 76, B14: 84, B15: 62 },
    { metric: 'Attendance', B13: 88, B14: 94, B15: 79 },
    { metric: 'Engagement', B13: 80, B14: 90, B15: 55 },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>📊 Batch Cohort Comparison</h1>
        <p>Side-by-side analytics across all active batches</p>
      </div>

      {/* AI Insight */}
      <motion.div
        className="card highlight-card-lavender"
        style={{ marginBottom: 24 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-16">
          <div style={{ fontSize: 40 }}>🤖</div>
          <div>
            <h3 style={{ marginBottom: 8 }}>AI Comparison Insight</h3>
            <p style={{ fontSize: 14, color: 'var(--base-text-secondary)', lineHeight: 1.6 }}>
              <strong>Batch 14 outperforms by 23%</strong> across all metrics. Key differentiator: Trainer Sunita Iyer's
              interactive delivery style in Angular sessions. Batch 15 needs immediate attention — feedback completion
              at 65% is well below the 75% target. Recommend activating the 3-tier reminder system.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Radar Chart */}
        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🎯 Multi-Metric Comparison</div>
          <LiveChartContainer height={350} ariaLabel="Multi-metric batch comparison">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="metric" fontSize={12} stroke="rgba(255,255,255,0.5)" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} stroke="rgba(255,255,255,0.35)" />
              <Radar name="Batch 13" dataKey="B13" stroke={BRAND_HEX.violet} fill={BRAND_HEX.violet} fillOpacity={0.2} strokeWidth={2} isAnimationActive animationDuration={1200} />
              <Radar name="Batch 14" dataKey="B14" stroke={BRAND_HEX.blue} fill={BRAND_HEX.blue} fillOpacity={0.2} strokeWidth={2} isAnimationActive animationDuration={1200} />
              <Radar name="Batch 15" dataKey="B15" stroke={BRAND_HEX.amber} fill={BRAND_HEX.amber} fillOpacity={0.25} strokeWidth={2} isAnimationActive animationDuration={1200} />
              <Tooltip contentStyle={chartTooltipStyle} />
            </RadarChart>
          </LiveChartContainer>
          <div className="flex justify-center gap-16 mt-8">
            <span className="flex items-center gap-4"><div style={{ width: 12, height: 12, borderRadius: 3, background: BRAND_HEX.violet }} /> Batch 13</span>
            <span className="flex items-center gap-4"><div style={{ width: 12, height: 12, borderRadius: 3, background: BRAND_HEX.blue }} /> Batch 14</span>
            <span className="flex items-center gap-4"><div style={{ width: 12, height: 12, borderRadius: 3, background: BRAND_HEX.amber }} /> Batch 15</span>
          </div>
        </AppMagicCard>

        {/* Batch Cards */}
        <div className="flex flex-col gap-16">
          {batches.map((batch, i) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <AppMagicCard
                className="card"
                style={{ borderLeft: `4px solid ${batch.health === 'green' ? 'var(--accent-blue)' : batch.health === 'amber' ? 'var(--accent-amber)' : 'var(--accent-violet)'}` }}
              >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{batch.name}</div>
                  <div className="text-sm text-secondary">Phase {batch.phase} · {batch.track} · {batch.maverickCount} Mavericks</div>
                </div>
                <div className={`rag-dot ${batch.health}`} style={{ width: 14, height: 14 }} />
              </div>

              <div className="grid-4" style={{ gap: 12 }}>
                {[
                  { label: 'Readiness', value: batch.avgReadiness, color: batch.avgReadiness >= 70 ? 'var(--accent-violet)' : 'var(--accent-amber)' },
                  { label: 'Feedback', value: `${batch.feedbackCompletion}%`, color: batch.feedbackCompletion >= 80 ? 'var(--accent-blue)' : 'var(--accent-violet)' },
                  { label: 'Trainer', value: batch.trainer || '—', color: 'var(--base-text)' },
                  { label: 'Phase', value: batch.phase, color: 'var(--accent-violet)' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div className="text-xs text-secondary">{stat.label}</div>
                  </div>
                ))}
              </div>
              </AppMagicCard>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
