import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Star, TrendingUp, Award, Download } from 'lucide-react'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import PersonAvatar from '../../components/PersonAvatar'
import mockData from '../../data/mockData.json'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const PHASE_LABELS = ['Pre-Onboarding', 'Spark: Soft Skills', 'Spark: Foundation Tech', 'Stream Training', 'Project Internship', 'Deployment', 'Post-Deploy']

function SkillBar({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.65)', textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}</span>
        <span style={{ color: '#fff', fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: 3,
            background: value >= 80 ? '#22c55e' : value >= 60 ? 'var(--brand-violet)' : '#f97316',
          }}
        />
      </div>
    </div>
  )
}

export default function MaverickPassportView() {
  const { maverickId } = useParams()
  const maverick = mockData.mavericks.find(m => m.id === maverickId) || mockData.mavericks[0]
  const badges = mockData.currentUser.badges || []

  const readinessColor = maverick.readinessScore >= 80 ? '#22c55e' : maverick.readinessScore >= 60 ? 'var(--brand-amber)' : '#ef4444'

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="manager"
          title="Maverick Passport"
          subtitle="Read-only training card — understand your Maverick before Day 1"
        />
      </motion.div>

      {/* Manager notice */}
      <motion.div variants={item}>
        <AppMagicCard style={{
          padding: '12px 16px', marginBottom: 20, borderRadius: 10,
          background: 'rgba(67,97,238,0.1)', border: '1px solid rgba(67,97,238,0.25)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Lock size={14} style={{ color: 'var(--brand-blue)', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Read-only view. Individual training scores are private. This passport shows training stream, skills summary, readiness score, and top strengths.
          </p>
        </AppMagicCard>
      </motion.div>

      {/* Identity card */}
      <motion.div variants={item}>
        <AppMagicCard className="card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <PersonAvatar userId={maverick.id} size={80} />
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%',
                background: '#22c55e', border: '2px solid #1a1730',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
              }}>
                ✓
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginBottom: 4 }}>{maverick.name}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 12, background: 'rgba(123,92,245,0.2)', border: '1px solid rgba(123,92,245,0.4)', color: '#c4b5fd', fontWeight: 600 }}>
                  {maverick.track}
                </span>
                {maverick.stream && (
                  <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 12, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
                    {maverick.stream}
                  </span>
                )}
                <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  Batch {maverick.batch}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  Phase {maverick.phase}: {PHASE_LABELS[maverick.phase]}
                </span>
              </div>
            </div>

            {/* Readiness Score */}
            <div style={{ textAlign: 'center', padding: '16px 24px', borderRadius: 16, background: `${readinessColor}14`, border: `1px solid ${readinessColor}44` }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                Readiness Score
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: readinessColor, lineHeight: 1 }}>
                {maverick.readinessScore}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>/ 100</div>
            </div>
          </div>
        </AppMagicCard>
      </motion.div>

      {/* Skills */}
      <motion.div variants={item} className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <AppMagicCard className="card" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--brand-violet)' }} /> Technical Skills
          </h4>
          {Object.entries(maverick.skills || {}).filter(([k]) => !['communication', 'teamwork'].includes(k)).map(([key, val]) => (
            <SkillBar key={key} label={key} value={val} />
          ))}
        </AppMagicCard>

        <AppMagicCard className="card" style={{ padding: 24 }}>
          <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={16} style={{ color: 'var(--brand-amber)' }} /> Soft Skills & Context
          </h4>
          {Object.entries(maverick.skills || {}).filter(([k]) => ['communication', 'teamwork'].includes(k)).map(([key, val]) => (
            <SkillBar key={key} label={key} value={val} />
          ))}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>Training Stats</div>
            {[
              ['Attendance', maverick.attendance + '%'],
              ['Feedback Rate', maverick.feedbackRate + '%'],
              ['Quiz Average', maverick.quizAvg + '%'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </AppMagicCard>
      </motion.div>

      {/* Badges */}
      {badges.length > 0 && (
        <motion.div variants={item}>
          <AppMagicCard className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={16} style={{ color: 'var(--brand-amber)' }} /> Training Badges
            </h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {badges.map(badge => (
                <div key={badge} style={{
                  padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: 'rgba(247,201,72,0.12)', border: '1px solid rgba(247,201,72,0.3)', color: '#fcd34d',
                }}>
                  🏅 {badge.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
              ))}
            </div>
          </AppMagicCard>
        </motion.div>
      )}

      {/* Export */}
      <motion.div variants={item} style={{ display: 'flex', gap: 10 }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary"
          onClick={() => window.print()}
        >
          <Download size={16} /> Export Passport PDF
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
