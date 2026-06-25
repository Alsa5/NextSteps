import React, { useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import confetti from 'react-confetti'
import AppMagicCard from '../../components/AppMagicCard'
import { AuthContext } from '../../context/AuthContext'
import { submitPulseFeedback } from '../../data/maverickProgress'
import mockData from '../../data/mockData.json'

const moods = [
  { id: 'great', emoji: '😄', label: 'Great' },
  { id: 'good', emoji: '🙂', label: 'Good' },
  { id: 'okay', emoji: '😐', label: 'Okay' },
  { id: 'confused', emoji: '😕', label: 'Confused' },
]

export default function PulseFeedback() {
  const { user: authUser } = useContext(AuthContext)
  const latestSession = [...mockData.sessions].reverse().find((s) => s.status === 'completed') || mockData.sessions[1]
  const [mood, setMood] = useState(null)
  const [clarity, setClarity] = useState(3)
  const [pace, setPace] = useState(3)
  const [openText, setOpenText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleSubmit = async () => {
    if (!mood) { toast.error('Please select your mood'); return }
    
    try {
      // Submit to backend API instead of localStorage
      const response = await fetch('/api/v1/session-feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('nextsteps_token')}`
        },
        body: JSON.stringify({
          sessionId: latestSession.id,
          sessionTitle: latestSession.title,
          batchId: mockData.currentUser.batch,
          trainerEmail: latestSession.trainerEmail || 'rajesh.menon@hexaware.com', // fallback for mock data
          mood,
          clarity,
          pace,
          openText: openText.trim() || undefined,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit feedback')
      }

      const result = await response.json()
      console.log('✅ Feedback submitted:', result)
      
      // Still award XP locally for immediate feedback
      submitPulseFeedback({
        sessionId: latestSession.id,
        sessionTitle: latestSession.title,
        mood,
        clarity,
        pace,
        openText,
        maverickName: authUser?.name || mockData.currentUser.name,
        batchId: mockData.currentUser.batch,
      })
      
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast.error(error.message || 'Failed to submit feedback')
      return
    }
    
    setShowConfetti(true)
    setSubmitted(true)
    toast.success('+30 XP earned! 🎉', { duration: 3000 })
    // Feedback goes to L&D, not the trainer directly
    setTimeout(() => {
      toast(
        '📊 Your feedback has been recorded — L&D will review trainer performance',
        { icon: '🔔', duration: 5000, style: { background: '#1e1b3a', color: '#c4b0ff', border: '1px solid rgba(123,92,245,0.3)' } },
      )
    }, 1500)
    setTimeout(() => setShowConfetti(false), 4000)
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '80px 20px' }}>
        {showConfetti && <confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} />}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: 80, marginBottom: 24 }}
        >
          🎉
        </motion.div>
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>Feedback Submitted!</h2>
        <p style={{ color: 'var(--base-text-secondary)', marginBottom: 8 }}>You earned <strong style={{ color: 'var(--accent-violet)' }}>+30 XP</strong></p>
        <p style={{ color: 'var(--base-text-secondary)', fontSize: 14 }}>Your streak continues! 🔥 Keep it going tomorrow.</p>
        <button className="btn btn-primary mt-24" onClick={() => { setSubmitted(false); setMood(null); setClarity(3); setPace(3); setOpenText('') }}>
          Submit Another
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>⚡ Pulse Feedback</h1>
        <p>30 seconds. 3 questions. 30 XP. Quick and painless!</p>
      </div>

      <AppMagicCard className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span className="tag tag-violet">Session: {latestSession.title}</span>
          <span className="tag tag-amber" style={{ marginLeft: 8 }}>+30 XP</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--base-text-secondary)', marginBottom: 32 }}>
          Auto-closes in 1h 45m
        </div>

        {/* Mood */}
        <div style={{ marginBottom: 32 }}>
          <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: 16 }}>
            How are you feeling about this session?
          </label>
          <div className="mood-selector" style={{ justifyContent: 'center' }}>
            {moods.map(m => (
              <motion.button
                key={m.id}
                className={`mood-btn ${mood === m.id ? 'selected' : ''}`}
                onClick={() => setMood(m.id)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {m.emoji}
              </motion.button>
            ))}
          </div>
          {mood && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--accent-violet)', fontWeight: 600 }}>
              {moods.find(m => m.id === mood)?.label}
            </motion.div>
          )}
        </div>

        {/* Clarity */}
        <div style={{ marginBottom: 28 }}>
          <label className="form-label">Clarity — How clear was the content?</label>
          <div className="slider-container">
            <span style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>Unclear</span>
            <input type="range" className="slider" min="1" max="5" value={clarity} onChange={e => setClarity(Number(e.target.value))} />
            <span style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>Crystal</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-violet)', minWidth: 24, textAlign: 'center' }}>{clarity}</span>
          </div>
        </div>

        {/* Pace */}
        <div style={{ marginBottom: 28 }}>
          <label className="form-label">Pace — How was the speed?</label>
          <div className="slider-container">
            <span style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>Too Slow</span>
            <input type="range" className="slider" min="1" max="5" value={pace} onChange={e => setPace(Number(e.target.value))} />
            <span style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>Too Fast</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-violet)', minWidth: 24, textAlign: 'center' }}>{pace}</span>
          </div>
        </div>

        {/* Open Text */}
        <div style={{ marginBottom: 28 }}>
          <label className="form-label">Anything else? (optional)</label>
          <textarea
            className="form-textarea"
            value={openText}
            onChange={e => setOpenText(e.target.value)}
            placeholder="Quick thought about the session..."
            style={{ minHeight: 70 }}
          />
        </div>

        <motion.button
          className="btn btn-primary btn-lg w-full"
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          ⚡ Submit Pulse (+30 XP)
        </motion.button>
      </AppMagicCard>
    </motion.div>
  )
}
