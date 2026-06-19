import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Send, CheckCircle, TrendingDown, Zap } from 'lucide-react'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import PersonAvatar from '../../components/PersonAvatar'
import mockData from '../../data/mockData.json'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const GAP_CATEGORIES = [
  { id: 'technical', label: 'Technical Skills', icon: '💻' },
  { id: 'problem_solving', label: 'Problem Solving', icon: '🧩' },
  { id: 'communication', label: 'Communication', icon: '💬' },
  { id: 'teamwork', label: 'Team Integration', icon: '🤝' },
  { id: 'initiative', label: 'Initiative & Ownership', icon: '🎯' },
]

const PROGRAM_RECS = [
  { id: 'evolve', name: 'Evolve Programme', description: 'Structured re-skilling track targeting the identified gap areas. 4-week intensive, mentored.', tag: 'Recommended' },
  { id: 'jumpstart', name: 'Jumpstart Bootcamp', description: 'Fast-track hands-on bootcamp. Ideal for Mavericks with strong fundamentals but execution gaps.', tag: null },
  { id: 'coaching', name: 'L&D Coaching Session', description: 'One-on-one L&D coaching + peer pairing. Lighter touch, suitable for isolated soft-skill gaps.', tag: null },
]

export default function EarlyPerformanceAlert() {
  const [selectedMavId, setSelectedMavId] = useState(null)
  const [selectedGaps, setSelectedGaps] = useState([])
  const [context, setContext] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('evolve')
  const [submitted, setSubmitted] = useState(false)
  const [submittedFor, setSubmittedFor] = useState([])

  const deployedMavericks = mockData.mavericks.slice(0, 4)
  const selectedMav = deployedMavericks.find(m => m.id === selectedMavId)

  const toggleGap = (id) => setSelectedGaps(prev =>
    prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedMavId || selectedGaps.length === 0) return
    setSubmittedFor(prev => [...prev, selectedMavId])
    setSubmitted(true)
  }

  const handleNewAlert = () => {
    setSelectedMavId(null)
    setSelectedGaps([])
    setContext('')
    setSelectedProgram('evolve')
    setSubmitted(false)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="manager"
          title="Early Performance Alert"
          subtitle="Flag a Maverick for L&D intervention — prevent small gaps from becoming big problems"
        />
      </motion.div>

      <motion.div variants={item}>
        <AppMagicCard className="card card-accent-soft" style={{ marginBottom: 24, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} style={{ color: 'var(--brand-amber)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>What happens when you flag a Maverick?</span>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
              L&D is automatically notified. An Evolve or Jumpstart programme recommendation is attached. The Maverick's training history is cross-referenced to identify the root cause.
            </p>
          </div>
        </AppMagicCard>
      </motion.div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <AppMagicCard className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🚨</div>
              <h2 style={{ marginBottom: 8 }}>Alert Submitted</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, lineHeight: 1.7 }}>
                L&D has been notified about <strong style={{ color: '#fff' }}>{selectedMav?.name}</strong>.
                An <strong style={{ color: 'var(--brand-amber)' }}>{PROGRAM_RECS.find(p => p.id === selectedProgram)?.name}</strong> has been recommended.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 24 }}>
                You'll receive a follow-up within 2 business days with an action plan.
              </p>
              <motion.button
                onClick={handleNewAlert}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
              >
                Flag Another Maverick
              </motion.button>
            </AppMagicCard>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <form onSubmit={handleSubmit}>
              {/* Step 1: Select Maverick */}
              <motion.div variants={item}>
                <h3 style={{ marginBottom: 12 }}>1. Select Maverick</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
                  {deployedMavericks.map(mav => {
                    const flagged = submittedFor.includes(mav.id)
                    const selected = selectedMavId === mav.id
                    return (
                      <button
                        key={mav.id}
                        type="button"
                        disabled={flagged}
                        onClick={() => setSelectedMavId(mav.id)}
                        className="card"
                        style={{
                          padding: 14, cursor: flagged ? 'default' : 'pointer', opacity: flagged ? 0.5 : 1,
                          border: `1px solid ${selected ? 'rgba(239,68,68,0.5)' : flagged ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          background: selected ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                          borderRadius: 12, textAlign: 'left', width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <PersonAvatar userId={mav.id} size={36} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{mav.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                              {mav.stream || mav.track} · Readiness {mav.readinessScore}
                            </div>
                          </div>
                          {flagged && <CheckCircle size={14} style={{ color: '#22c55e' }} />}
                          {selected && <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>

              {/* Step 2: Gap categories */}
              <motion.div variants={item}>
                <h3 style={{ marginBottom: 12 }}>2. Identify Performance Gaps</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                  {GAP_CATEGORIES.map(gap => (
                    <motion.button
                      key={gap.id}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleGap(gap.id)}
                      style={{
                        padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                        border: `1px solid ${selectedGaps.includes(gap.id) ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        background: selectedGaps.includes(gap.id) ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                        color: selectedGaps.includes(gap.id) ? '#fca5a5' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {gap.icon} {gap.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Step 3: Context */}
              <motion.div variants={item} style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 12 }}>3. Provide Context</h3>
                <textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder="Describe specific observations — what behaviours or outcomes triggered this flag? Be specific so L&D can act quickly."
                  rows={4}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10,
                    border: '1px solid rgba(123,92,245,0.3)', background: 'rgba(0,0,0,0.2)',
                    color: '#fff', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </motion.div>

              {/* Step 4: Programme recommendation */}
              <motion.div variants={item} style={{ marginBottom: 28 }}>
                <h3 style={{ marginBottom: 12 }}>4. Recommend Intervention Programme</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PROGRAM_RECS.map(prog => (
                    <label
                      key={prog.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12, cursor: 'pointer',
                        border: `1px solid ${selectedProgram === prog.id ? 'rgba(123,92,245,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        background: selectedProgram === prog.id ? 'rgba(123,92,245,0.1)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={prog.id}
                        checked={selectedProgram === prog.id}
                        onChange={() => setSelectedProgram(prog.id)}
                        style={{ marginTop: 3 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {prog.name}
                          {prog.tag && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(247,201,72,0.2)', border: '1px solid rgba(247,201,72,0.4)', color: 'var(--brand-amber)' }}>
                              {prog.tag}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.6 }}>{prog.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </motion.div>

              <motion.button
                type="submit"
                disabled={!selectedMavId || selectedGaps.length === 0}
                whileHover={selectedMavId && selectedGaps.length > 0 ? { scale: 1.02 } : {}}
                whileTap={selectedMavId && selectedGaps.length > 0 ? { scale: 0.97 } : {}}
                className="btn btn-primary"
                style={{ opacity: !selectedMavId || selectedGaps.length === 0 ? 0.45 : 1 }}
              >
                <Send size={16} /> Submit Alert to L&D
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
