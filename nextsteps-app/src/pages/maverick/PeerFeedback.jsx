import { useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Star, Send, CheckCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import PersonAvatar from '../../components/PersonAvatar'
import mockData from '../../data/mockData.json'
import { AuthContext } from '../../context/AuthContext'
import { markPeerFeedbackDone } from '../../data/maverickProgress'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const PEER_PROMPTS = [
  { id: 'collaboration', label: 'Collaboration', question: 'How effectively did they collaborate during group activities?' },
  { id: 'communication', label: 'Communication', question: 'How clear and concise was their communication?' },
  { id: 'contribution', label: 'Contribution', question: 'Did they actively contribute ideas and effort?' },
  { id: 'support', label: 'Support', question: 'Did they support teammates who needed help?' },
]

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(null)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <motion.button
          key={n}
          type="button"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: n <= (hover ?? value) ? 'var(--brand-amber)' : 'rgba(255,255,255,0.2)',
          }}
          aria-label={`Rate ${n} stars`}
        >
          <Star size={22} fill={n <= (hover ?? value) ? 'currentColor' : 'none'} />
        </motion.button>
      ))}
    </div>
  )
}

export default function PeerFeedback() {
  const { user: authUser } = useContext(AuthContext)
  const myBatch = mockData.currentUser.batch
  const myBatchPeers = mockData.mavericks.filter(
    (m) => m.batch === myBatch && m.id !== 'mav-001',
  )
  const [selectedPeer, setSelectedPeer] = useState(null)
  const [ratings, setRatings] = useState({})
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedPeers, setSubmittedPeers] = useState([])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedPeer) return
    if (Object.keys(ratings).length < PEER_PROMPTS.length) {
      toast.error('Please rate all categories')
      return
    }
    markPeerFeedbackDone(selectedPeer.id)
    setSubmittedPeers(prev => [...prev, selectedPeer.id])
    setSubmitted(true)
    toast.success('+40 XP earned for peer feedback! 🎉')
  }

  const handleNewFeedback = () => {
    setSelectedPeer(null)
    setRatings({})
    setComment('')
    setSubmitted(false)
  }

  const allRated = PEER_PROMPTS.every(p => ratings[p.id] > 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="maverick"
          title="Peer Feedback"
          subtitle="Recognize your batch teammates — earn 40 XP per submission"
        />
      </motion.div>

      {/* XP info */}
      <motion.div variants={item}>
        <AppMagicCard className="card card-accent-soft" style={{ marginBottom: 24, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Zap size={20} style={{ color: 'var(--brand-amber)', flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 600, fontSize: 14 }}>+40 XP per peer feedback</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
              Submit 5 times to earn the <strong style={{ color: '#fff' }}>Team Player</strong> badge
            </span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {submittedPeers.length}/5 submitted
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
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                style={{ fontSize: 64, marginBottom: 16 }}
              >
                🤝
              </motion.div>
              <h2 style={{ marginBottom: 8 }}>Feedback Submitted!</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>
                Your feedback for <strong style={{ color: '#fff' }}>{selectedPeer?.name}</strong> has been recorded.
                It will only be shared as aggregated insights — never individually attributed.
              </p>
              <p style={{ color: 'var(--brand-amber)', fontWeight: 700, marginBottom: 24 }}>
                <Zap size={14} style={{ verticalAlign: 'middle' }} /> +40 XP earned
              </p>
              <motion.button
                onClick={handleNewFeedback}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
              >
                Give Feedback to Another Peer
              </motion.button>
            </AppMagicCard>
          </motion.div>
        ) : !selectedPeer ? (
          <motion.div key="peer-select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div variants={item}>
              <h3 style={{ marginBottom: 12 }}>Select a Batch Peer</h3>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {myBatchPeers.map((peer, i) => {
                const done = submittedPeers.includes(peer.id)
                return (
                  <motion.div
                    key={peer.id}
                    variants={item}
                  >
                    <AppMagicCard
                      className="card"
                      style={{
                        padding: 16, cursor: done ? 'default' : 'pointer',
                        opacity: done ? 0.55 : 1,
                        border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                      onClick={() => !done && setSelectedPeer(peer)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <PersonAvatar userId={peer.id} size={40} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{peer.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{peer.track} · Phase {peer.phase}</div>
                        </div>
                        {done && <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />}
                      </div>
                    </AppMagicCard>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="feedback-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <AppMagicCard className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <PersonAvatar userId={selectedPeer.id} size={52} />
                <div>
                  <h3 style={{ marginBottom: 4 }}>{selectedPeer.name}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedPeer.track} · Batch {selectedPeer.batch}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPeer(null)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                  {PEER_PROMPTS.map(prompt => (
                    <div key={prompt.id}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{prompt.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{prompt.question}</div>
                      <StarRating
                        value={ratings[prompt.id] || 0}
                        onChange={v => setRatings(prev => ({ ...prev, [prompt.id]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                    Additional Comments <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="What stood out about this peer? Be honest and constructive."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      border: '1px solid rgba(123,92,245,0.3)', background: 'rgba(0,0,0,0.2)',
                      color: '#fff', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={!allRated}
                  whileHover={allRated ? { scale: 1.02 } : {}}
                  whileTap={allRated ? { scale: 0.97 } : {}}
                  className="btn btn-primary"
                  style={{ opacity: allRated ? 1 : 0.5, cursor: allRated ? 'pointer' : 'default' }}
                >
                  <Send size={16} /> Submit Feedback (+40 XP)
                </motion.button>
              </form>
            </AppMagicCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
