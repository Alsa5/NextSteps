import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import AppMagicCard from '../../components/AppMagicCard'

const questions = [
  { id: 'content', label: 'Content Quality', type: 'rating' },
  { id: 'trainer', label: 'Trainer Effectiveness', type: 'rating' },
  { id: 'resources', label: 'Resource Usefulness', type: 'rating' },
  { id: 'pacing', label: 'Pacing', type: 'rating' },
  { id: 'confused', label: 'What confused you the most?', type: 'text' },
  { id: 'improve', label: 'What could be improved?', type: 'text' },
  { id: 'overall', label: 'Overall Rating', type: 'rating' },
  { id: 'suggestions', label: 'Any suggestions for future sessions?', type: 'text' },
]

export default function DeepFeedback() {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const setRating = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }))
  const setText = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }))

  const q = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  const handleNext = () => {
    if (currentStep < questions.length - 1) setCurrentStep(prev => prev + 1)
    else {
      setSubmitted(true)
      toast.success('+80 XP earned! Deep feedback submitted 🎉', { duration: 3000 })
      setTimeout(() => {
        toast(
          '📊 Deep feedback submitted to L&D — trainer effectiveness analytics updated',
          { icon: '🔔', duration: 6000, style: { background: '#1e1b3a', color: '#c4b0ff', border: '1px solid rgba(123,92,245,0.3)' } },
        )
      }, 1800)
    }
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>📝</div>
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>Deep Feedback Complete!</h2>
        <p style={{ color: 'var(--base-text-secondary)' }}>You earned <strong style={{ color: 'var(--accent-violet)' }}>+80 XP</strong></p>
        <p style={{ color: 'var(--base-text-secondary)', fontSize: 14, marginTop: 8 }}>Your detailed feedback helps improve the curriculum for everyone.</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>📝 Deep Feedback</h1>
        <p>8 questions. Detailed insights. 80 XP. Available for 24 hours after session.</p>
      </div>

      <AppMagicCard className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div className="flex items-center justify-between mb-8">
            <span className="text-sm text-secondary">Question {currentStep + 1} of {questions.length}</span>
            <span className="tag tag-amber">+80 XP</span>
          </div>
          <div className="progress-bar">
            <motion.div className="progress-fill violet" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>

        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <label className="form-label" style={{ fontSize: 16, marginBottom: 20 }}>{q.label}</label>

          {q.type === 'rating' && (
            <div className="rating-stars" style={{ justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <motion.span
                  key={star}
                  className={`rating-star ${(answers[q.id] || 0) >= star ? 'filled' : ''}`}
                  onClick={() => setRating(q.id, star)}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ fontSize: 36, cursor: 'pointer' }}
                >
                  ★
                </motion.span>
              ))}
            </div>
          )}

          {q.type === 'text' && (
            <textarea
              className="form-textarea"
              value={answers[q.id] || ''}
              onChange={e => setText(q.id, e.target.value)}
              placeholder="Share your thoughts..."
              style={{ marginBottom: 24 }}
            />
          )}
        </motion.div>

        <div className="flex gap-12">
          {currentStep > 0 && (
            <button className="btn btn-outline" onClick={() => setCurrentStep(prev => prev - 1)} style={{ flex: 1 }}>
              ← Previous
            </button>
          )}
          <motion.button
            className="btn btn-primary"
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {currentStep === questions.length - 1 ? 'Submit (+80 XP)' : 'Next →'}
          </motion.button>
        </div>
      </AppMagicCard>
    </motion.div>
  )
}
