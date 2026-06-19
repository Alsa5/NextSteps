import React from 'react'
import { motion } from 'framer-motion'
import mockData from '../../data/mockData.json'

import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'

const phaseColors = [
  BRAND_HEX.violet,
  BRAND_HEX.blue,
  BRAND_HEX.amber,
  BRAND_HEX.violet,
  BRAND_HEX.blue,
  BRAND_HEX.amber,
  BRAND_HEX.violet,
]
const phaseIcons = ['🌱', '✨', '🔧', '🎯', '🏗️', '🚀', '📊']

export default function PhaseTimeline() {
  const currentPhase = mockData.currentUser.phase
  const phases = mockData.phases

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>📅 Phase Timeline</h1>
        <p>Your complete Maverick journey from pre-onboarding to post-deployment review</p>
      </div>

      {/* Current Phase Highlight */}
      <motion.div
        style={{ marginBottom: 32 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AppMagicCard className="card highlight-card-lavender">
        <div className="flex items-center gap-20">
          <div style={{ fontSize: 56 }}>{phaseIcons[currentPhase]}</div>
          <div>
            <div className="tag tag-violet" style={{ marginBottom: 8 }}>Current Phase</div>
            <h2 style={{ fontSize: 24, marginBottom: 4 }}>Phase {currentPhase}: {phases[currentPhase].name}</h2>
            <p style={{ color: 'var(--base-text-secondary)' }}>{phases[currentPhase].description}</p>
            <div className="flex items-center gap-12 mt-8">
              <span className="tag tag-blue">Duration: {phases[currentPhase].duration}</span>
              <span className="tag tag-green">Track: GET</span>
            </div>
          </div>
        </div>
        </AppMagicCard>
      </motion.div>
      <div style={{ position: 'relative', paddingLeft: 40 }}>
        {/* Vertical Line */}
        <div style={{
          position: 'absolute', left: 19, top: 0, bottom: 0, width: 2,
          background: 'linear-gradient(180deg, var(--accent-violet), var(--accent-blue))'
        }} />

        {phases.map((phase, i) => {
          const isActive = i === currentPhase
          const isCompleted = i < currentPhase
          const isFuture = i > currentPhase

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ position: 'relative', marginBottom: 24 }}
            >
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -31, top: 20,
                width: isActive ? 24 : 16, height: isActive ? 24 : 16,
                borderRadius: '50%',
                background: isCompleted ? 'var(--accent-emerald)' : isActive ? phaseColors[i] : 'var(--base-border)',
                border: isActive ? `3px solid ${phaseColors[i]}` : 'none',
                boxShadow: isActive ? `0 0 16px ${phaseColors[i]}44` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: isActive ? 'translate(-4px, -4px)' : 'none'
              }}>
                {isCompleted && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                {isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute', inset: -6, borderRadius: '50%',
                      border: `2px solid ${phaseColors[i]}`, opacity: 0.3
                    }}
                  />
                )}
              </div>

              {/* Card */}
              <AppMagicCard
                className="card"
                style={{
                  opacity: isFuture ? 0.5 : 1,
                  borderColor: isActive ? phaseColors[i] : 'var(--base-border)',
                  borderWidth: isActive ? 2 : 1,
                  background: isActive ? `linear-gradient(135deg, ${phaseColors[i]}08, ${phaseColors[i]}15)` : 'var(--base-card)'
                }}
              >
                <div className="flex items-center gap-16">
                  <div style={{ fontSize: 32 }}>{phaseIcons[i]}</div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-8 mb-8">
                      <span style={{ fontWeight: 800, fontSize: 13, color: phaseColors[i] }}>PHASE {phase.id}</span>
                      {isCompleted && <span className="tag tag-green">✅ Completed</span>}
                      {isActive && <span className="tag tag-violet">🔄 In Progress</span>}
                      {isFuture && <span className="tag" style={{ background: 'var(--base-surface)', color: 'var(--base-text-secondary)' }}>🔒 Upcoming</span>}
                    </div>
                    <h3 style={{ fontSize: 18, marginBottom: 4 }}>{phase.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--base-text-secondary)' }}>{phase.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: phaseColors[i] }}>{phase.duration}</div>
                  </div>
                </div>
              </AppMagicCard>
            </motion.div>
          )
        })}
      </div>

      {/* Estimated Deployment */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <AppMagicCard className="card mt-24 highlight-card-mint" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
        <h3 style={{ marginBottom: 8 }}>Estimated Deployment</h3>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-violet)' }}>
          July 2025
        </div>
        <p style={{ color: 'var(--base-text-secondary)', fontSize: 13, marginTop: 8 }}>
          Based on your current track (GET) and phase progress
        </p>
        </AppMagicCard>
      </motion.div>
    </motion.div>
  )
}
