import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import mockData from '../../data/mockData.json'
import PersonAvatar from '../../components/PersonAvatar'
import AppMagicCard from '../../components/AppMagicCard'

const categories = [
  { id: 'technical', label: 'Technical Skills', desc: 'Coding ability, tool proficiency, domain knowledge' },
  { id: 'problemSolving', label: 'Problem Solving', desc: 'Analytical thinking, debugging, solution design' },
  { id: 'communication', label: 'Communication', desc: 'Written, verbal, presentation, client interaction' },
  { id: 'teamIntegration', label: 'Team Integration', desc: 'Collaboration, adaptability, cultural fit' },
  { id: 'initiative', label: 'Initiative', desc: 'Proactiveness, self-learning, ownership' },
]

export default function PerformanceReview() {
  const { maverickId } = useParams()
  const navigate = useNavigate()
  const maverick = mockData.mavericks.find(m => m.id === maverickId)
  const [ratings, setRatings] = useState({})
  const [comments, setComments] = useState('')
  const [reviewMonth, setReviewMonth] = useState('3')

  const setRating = (cat, val) => setRatings(prev => ({ ...prev, [cat]: val }))

  const submitReview = () => {
    const filled = Object.keys(ratings).length
    if (filled < categories.length) { toast.error('Please rate all categories'); return }
    toast.success('Performance review submitted!', { duration: 3000 })
    setTimeout(() => {
      toast(
        '🔔 L&D notified · Maverick receives their assessment summary within 24h',
        { icon: '📬', duration: 6000, style: { background: '#1e1b3a', color: '#f7c948', border: '1px solid rgba(247,201,72,0.3)' } },
      )
    }, 1600)
    navigate('/')
  }

  if (!maverick) return <div>Maverick not found</div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>⭐ Performance Review</h1>
        <p>Structured review for {maverick.name}</p>
      </div>

      <AppMagicCard className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Maverick Info */}
        <div style={{ padding: 20, borderRadius: 'var(--radius-md)', background: 'var(--secondary-lavender)', marginBottom: 24 }}>
          <div className="flex items-center gap-16">
            <div className="avatar-cell-rounded">
              <PersonAvatar userId={maverick.id} size={56} title={maverick.name} />
            </div>
            <div>
              <h3>{maverick.name}</h3>
              <div className="flex gap-8 mt-4">
                <span className="tag tag-violet">{maverick.batch}</span>
                <span className="tag tag-blue">{maverick.stream || 'Product Engineering'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Month */}
        <div className="form-group">
          <label className="form-label">Review Period</label>
          <select className="form-input" value={reviewMonth} onChange={e => setReviewMonth(e.target.value)}>
            <option value="1">Month 1 Review</option>
            <option value="3">Month 3 Review</option>
            <option value="6">Month 6 Review</option>
          </select>
        </div>

        {/* Rating Categories */}
        <div className="flex flex-col gap-20 mb-24">
          {categories.map(cat => (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{cat.label}</div>
                  <div className="text-xs text-secondary">{cat.desc}</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent-amber)' }}>
                  {ratings[cat.id] || '—'}/5
                </span>
              </div>
              <div className="rating-stars" style={{ gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <motion.span
                    key={star}
                    className={`rating-star ${(ratings[cat.id] || 0) >= star ? 'filled' : ''}`}
                    onClick={() => setRating(cat.id, star)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ fontSize: 28 }}
                  >
                    ★
                  </motion.span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div className="form-group">
          <label className="form-label">Open Comments (optional)</label>
          <textarea
            className="form-textarea"
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Share observations about the Maverick's performance, strengths, and areas for improvement..."
            style={{ minHeight: 120 }}
          />
          <p className="text-xs text-secondary mt-8">
            🛡️ Sentiment from comments feeds back to L&D anonymously as 'training gap signals'
          </p>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-outline" onClick={() => navigate('/')} style={{ flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={submitReview}
            whileHover={{ scale: 1.02 }}
            style={{ flex: 2, justifyContent: 'center' }}
          >
            ⭐ Submit Review
          </motion.button>
        </div>
      </AppMagicCard>
    </motion.div>
  )
}
