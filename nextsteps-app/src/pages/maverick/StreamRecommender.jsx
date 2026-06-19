import React from 'react'
import { motion } from 'framer-motion'
import mockData from '../../data/mockData.json'
import { BRAND_HEX } from '../../theme/brandPalette'

const streamIcons = {
  'Product Engineering': '🏗️',
  'Digital': '💻',
  'Automation': '🤖',
  'Analytics': '📊',
  'Innovation': '💡',
  'Banking': '🏦',
  'HI': '🤝',
  'Data Assurance': '🛡️',
}

const { violet, blue, amber } = BRAND_HEX

const streamColors = [
  `linear-gradient(135deg, ${violet}, ${blue})`,
  `linear-gradient(135deg, ${blue}, ${amber})`,
  `linear-gradient(135deg, ${amber}, ${violet})`,
  `linear-gradient(135deg, ${violet}, ${amber})`,
  `linear-gradient(135deg, ${blue}, ${violet})`,
  `linear-gradient(135deg, ${amber}, ${blue})`,
  `linear-gradient(135deg, ${violet}, ${blue})`,
  `linear-gradient(135deg, ${blue}, ${amber})`,
]

export default function StreamRecommender() {
  const rec = mockData.streamRecommendation

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>🔮 AI Stream Recommender</h1>
        <p>Based on your quiz scores, skill profile, and interests — here's your personalized stream fit analysis.</p>
      </div>

      {/* AI Insight */}
      <motion.div
        className="card highlight-card-warm"
        style={{ marginBottom: 32, border: '1.5px solid var(--secondary-lavender-deep)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-16">
          <div style={{ fontSize: 48 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>AI Recommendation</div>
            <div style={{ fontSize: 14, color: 'var(--base-text-secondary)', lineHeight: 1.6 }}>
              Based on your strong Java and HTML/CSS scores, combined with your creative problem-solving patterns in feedback,
              <strong style={{ color: 'var(--accent-violet)' }}> Product Engineering</strong> is your best fit at 78%.
              Your JavaScript skills also make <strong style={{ color: 'var(--accent-blue)' }}> Digital</strong> a strong second option.
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stream Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
        {rec.recommendations.map((stream, i) => (
          <motion.div
            key={stream.stream}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02 }}
            style={{ overflow: 'hidden', position: 'relative' }}
          >
            {i === 0 && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'var(--gradient-primary)', color: 'white',
                padding: '4px 12px', borderRadius: 'var(--radius-full)',
                fontSize: 11, fontWeight: 700
              }}>
                ⭐ Best Match
              </div>
            )}

            <div className="flex items-center gap-16" style={{ marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                background: streamColors[i], display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 28
              }}>
                {streamIcons[stream.stream] || '📦'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{stream.stream}</div>
                <div style={{ fontSize: 13, color: 'var(--base-text-secondary)' }}>{stream.reason}</div>
              </div>
            </div>

            {/* Fit Bar */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm text-secondary">Fit Score</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: stream.fit >= 70 ? 'var(--accent-emerald)' : stream.fit >= 50 ? 'var(--accent-amber)' : 'var(--accent-coral)' }}>
                  {stream.fit}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 10 }}>
                <motion.div
                  className={`progress-fill ${stream.fit >= 70 ? 'emerald' : stream.fit >= 50 ? 'violet' : 'coral'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stream.fit}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
