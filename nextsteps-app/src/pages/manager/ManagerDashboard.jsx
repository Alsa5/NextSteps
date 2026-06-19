import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { AlertTriangle, Eye, FileText } from 'lucide-react'
import mockData from '../../data/mockData.json'
import PersonAvatar from '../../components/PersonAvatar'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'

export default function ManagerDashboard() {
  const manager = mockData.managers[0]
  const assignedMavericks = mockData.mavericks.filter((m) => manager.assignedMavericks.includes(m.id))
  const reviews = mockData.managerReviews

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <MetaversePageHero
        role="manager"
        title="Deployment Horizon"
        subtitle="Post-deployment Mavericks, Maverick Passport, and periodic performance reviews"
      />

      <div className="flex flex-col gap-24">
        {assignedMavericks.map((mav) => {
          const review = reviews.find((r) => r.maverickId === mav.id)
          return (
            <motion.div
              key={mav.id}
              className="card"
              data-welcome-spotlight={assignedMavericks[0]?.id === mav.id ? 'maverick-card' : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex gap-24">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-16 mb-16">
                    <div className="avatar-cell-rounded">
                      <PersonAvatar userId={mav.id} size={56} title={mav.name} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 20 }}>{mav.name}</h3>
                      <div className="flex gap-8 mt-8">
                        <span className="tag tag-violet">{mav.batch}</span>
                        <span className="tag tag-blue">{mav.stream || 'Pending'}</span>
                        <span className="tag tag-green">{mav.track}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--base-surface)', marginBottom: 16 }}>
                    <div className="flex items-center gap-8 mb-12">
                      <Eye size={14} color="var(--accent-violet)" />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Maverick Passport (read-only)</span>
                    </div>
                    <div className="grid-4" style={{ gap: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-violet)' }}>{mav.xp.toLocaleString()}</div>
                        <div className="text-xs text-secondary">XP</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>Lv{mav.level}</div>
                        <div className="text-xs text-secondary">Level</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-blue)' }}>{mav.attendance}%</div>
                        <div className="text-xs text-secondary">Attendance</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{mav.quizAvg}%</div>
                        <div className="text-xs text-secondary">Quiz Avg</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-12">
                    <Link to={`/review/${mav.id}`} className="btn btn-primary">
                      <FileText size={16} /> Submit Review
                    </Link>
                    <Link to={`/passport/${mav.id}`} className="btn btn-outline">
                      View Passport
                    </Link>
                    <Link to="/early-flags" className="btn btn-outline" style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,0.35)' }}>
                      <AlertTriangle size={16} /> Flag Performance
                    </Link>
                  </div>
                </div>

                <div style={{ width: 160, textAlign: 'center' }}>
                  <div style={{ width: 120, height: 120, margin: '0 auto 12px' }}>
                    <CircularProgressbar
                      value={mav.readinessScore}
                      text={`${mav.readinessScore}`}
                      styles={buildStyles({
                        textSize: '28px',
                        textColor: mav.readinessScore >= 80 ? BRAND_HEX.violet : BRAND_HEX.amber,
                        pathColor: mav.readinessScore >= 80 ? BRAND_HEX.violet : BRAND_HEX.amber,
                        trailColor: 'var(--base-surface)',
                      })}
                    />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Readiness Score</div>
                  <div className="text-xs text-secondary">Training history</div>
                </div>
              </div>

              {review && (
                <div style={{ marginTop: 20, padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--secondary-lavender)' }}>
                  <div className="flex items-center justify-between mb-12">
                    <span style={{ fontWeight: 700, fontSize: 14 }}>📝 Month {review.month} Review</span>
                    <span className="tag tag-violet">{review.date}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--base-text-secondary)', fontStyle: 'italic' }}>
                    &quot;{review.comments}&quot;
                  </p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <AppMagicCard className="card mt-24">
        <div className="card-title" style={{ marginBottom: 16 }}>📅 Review Schedule (M1, M3, M6)</div>
        <div className="grid-3" style={{ gap: 16 }}>
          {[
            { month: 'Month 1', date: 'Apr 15, 2025', status: 'completed' },
            { month: 'Month 3', date: 'Jun 15, 2025', status: 'upcoming' },
            { month: 'Month 6', date: 'Sep 15, 2025', status: 'upcoming' },
          ].map((review) => (
            <div
              key={review.month}
              style={{
                padding: 20,
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                background: review.status === 'completed' ? 'var(--secondary-mint)' : 'var(--base-surface)',
                border: `1.5px solid ${review.status === 'completed' ? 'var(--accent-emerald)' : 'var(--base-border)'}`,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{review.month}</div>
              <div className="text-sm text-secondary">{review.date}</div>
              <span className={`tag ${review.status === 'completed' ? 'tag-green' : 'tag-amber'}`} style={{ marginTop: 8 }}>
                {review.status === 'completed' ? '✅ Completed' : '⏰ Upcoming'}
              </span>
            </div>
          ))}
        </div>
      </AppMagicCard>
    </motion.div>
  )
}
