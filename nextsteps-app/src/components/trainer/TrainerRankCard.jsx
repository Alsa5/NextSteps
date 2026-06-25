import React, { useContext, useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import AppMagicCard from '../AppMagicCard'
import CertificateTemplate from '../CertificateTemplate'
import { AuthContext } from '../../context/AuthContext'
import { getTierIcon, getTierColor, getTierDisplayName } from '../../lib/trainerTierUtils'

const BADGES = [
  { id: 'consistency', name: 'Consistency', icon: '📈', requirement: '4+ High-Quality Sessions' },
  { id: 'clarity', name: 'Crystal Clear', icon: '🔮', requirement: 'Clarity ≥ 4.5' },
  { id: 'pace', name: 'Perfect Pace', icon: '⏱️', requirement: 'Pace ≥ 4.5' },
  { id: 'response', name: 'Response Master', icon: '🎯', requirement: '>90% Response' },
  { id: 'mood', name: 'Mood Maker', icon: '😄', requirement: '>80% Great' },
  { id: 'awe', name: 'Awe Collector', icon: '⭐', requirement: '10+ Awe Pts' },
]

export default function TrainerRankCard() {
  const { user: authUser } = useContext(AuthContext)
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hoveredBadge, setHoveredBadge] = useState(null)
  const [certificates, setCertificates] = useState([])
  const certRefs = useRef({})

  useEffect(() => {
    if (authUser?.email) {
      fetchTrainerScore()
    }
  }, [authUser?.email])

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const token = sessionStorage.getItem('nextsteps_token')
        // Use the logged-in trainer's own ID from the score data
        if (!score?._id) return
        const res = await fetch(`/api/v1/trainer-scores/${score._id}/certificates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setCertificates(data.certificates || [])
        }
      } catch (e) {
        console.error('Failed to fetch certificates', e)
      }
    }
    fetchCerts()
  }, [score?._id])

  const fetchTrainerScore = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = sessionStorage.getItem('nextsteps_token')
      if (!token) {
        throw new Error('No auth token')
      }

      const response = await fetch(`/api/v1/trainer-scores/${authUser.email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          setScore(null)
          setLoading(false)
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setScore(data)
      
    } catch (error) {
      console.error('Error fetching trainer score:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppMagicCard className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div>Loading rank card...</div>
      </AppMagicCard>
    )
  }

  if (error) {
    return (
      <AppMagicCard className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ color: 'var(--accent-coral)' }}>⚠️ {error}</div>
      </AppMagicCard>
    )
  }

  if (!score) {
    return (
      <AppMagicCard className="card">
        <div className="card-title">🌟 Personal Orbit</div>
        <div style={{ color: 'var(--base-text-secondary)', marginTop: 16 }}>
          Your rank card will appear once you have trainer feedback.
        </div>
      </AppMagicCard>
    )
  }

  const earnedBadges = BADGES.slice(0, Math.min(Math.floor(score.awePoints / 5), BADGES.length))
  const nextTierName = score.tier === 'platinum' ? 'Platinum' : ({ bronze: 'Silver', silver: 'Gold', gold: 'Platinum' })[score.tier]

  const handleDownloadCertificate = async (cert, idx) => {
    try {
      if (!certRefs.current[idx]) {
        toast.error('Certificate template not ready')
        return
      }
      
      // Wait for fonts to load
      await new Promise(r => setTimeout(r, 500))
      
      const canvas = await html2canvas(certRefs.current[idx], {
        backgroundColor: '#0a0520',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('[data-cert]')
          if (el) {
            el.style.position = 'relative'
            el.style.left = '0'
          }
        },
      })
      const link = document.createElement('a')
      link.download = `Certificate_${cert.tier}_${new Date(cert.issuedAt).toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Certificate downloaded!')
    } catch (e) {
      console.error('[TrainerRankCard] Download error:', e)
      toast.error('Failed to download certificate')
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <AppMagicCard className="card" style={{ 
        background: `linear-gradient(135deg, rgba(${getTierColor(score.tier).includes('#FFD700') ? '255,215,0' : '200,200,200'}, 0.05) 0%, transparent 100%)`,
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${getTierColor(score.tier)}40`
      }}>
        {/* Animated Background Glow */}
        <div style={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${getTierColor(score.tier)}20, transparent)`,
          filter: 'blur(60px)',
          animation: 'pulse 4s ease-in-out infinite'
        }} />

        <motion.div 
          style={{
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Header with Tier */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: getTierColor(score.tier), textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                🚀 Personal Orbit
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: getTierColor(score.tier), textShadow: `0 0 20px ${getTierColor(score.tier)}` }}>
                {getTierDisplayName(score.tier)}
              </div>
            </div>
            <motion.div 
              animate={{ rotateZ: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ fontSize: 64, filter: `drop-shadow(0 0 12px ${getTierColor(score.tier)})` }}
            >
              {getTierIcon(score.tier)}
            </motion.div>
          </div>

          {/* Score & Rank Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            <div style={{ padding: 16, background: 'var(--secondary-bg)', borderRadius: 12, border: '1px solid var(--base-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--base-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Current Score</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: getTierColor(score.tier) }}>{score.scorePercentage}</div>
              <div style={{ fontSize: 10, color: 'var(--accent-violet)', marginTop: 4 }}>/ 100 points</div>
            </div>

            <div style={{ padding: 16, background: 'var(--secondary-bg)', borderRadius: 12, border: '1px solid var(--base-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--base-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Awe Points</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-violet)' }}>{score.awePoints}</div>
              <div style={{ fontSize: 10, color: 'var(--accent-violet)', marginTop: 4 }}>⭐ Collected</div>
            </div>

            <div style={{ padding: 16, background: 'var(--secondary-bg)', borderRadius: 12, border: '1px solid var(--base-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--base-text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Streak</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#FF6B35' }}>{score.consecutiveHighQualitySessions}</div>
              <div style={{ fontSize: 10, color: '#FF6B35', marginTop: 4 }}>🔥 Sessions</div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {score.tier !== 'platinum' && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Progress to {nextTierName}</span>
                <span style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>{Math.round(score.progressToNextTier * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: 12, background: 'var(--base-border)', borderRadius: 6, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score.progressToNextTier * 100}%` }}
                  transition={{ duration: 1 }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${getTierColor(score.tier)}, var(--accent-violet))`,
                    borderRadius: 6,
                    boxShadow: `0 0 10px ${getTierColor(score.tier)}`
                  }}
                />
              </div>
            </div>
          )}

          {/* Achievements */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--base-text)' }}>
              🏆 Achievements ({earnedBadges.length}/{BADGES.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {BADGES.map((badge) => {
                const isEarned = earnedBadges.some(b => b.id === badge.id)
                return (
                  <motion.div
                    key={badge.id}
                    onMouseEnter={() => setHoveredBadge(badge.id)}
                    onMouseLeave={() => setHoveredBadge(null)}
                    whileHover={isEarned ? { scale: 1.05, y: -4 } : {}}
                    style={{
                      padding: 12,
                      background: isEarned ? `linear-gradient(135deg, var(--secondary-bg), rgba(147, 51, 234, 0.1))` : 'var(--base-border)',
                      borderRadius: 10,
                      border: isEarned ? `1px solid var(--accent-violet)` : '1px solid var(--base-border)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      opacity: isEarned ? 1 : 0.3,
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{badge.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isEarned ? 'var(--base-text)' : 'var(--base-text-secondary)' }}>
                      {badge.name}
                    </div>
                    {hoveredBadge === badge.id && isEarned && (
                      <div style={{
                        position: 'absolute',
                        bottom: -40,
                        left: 0,
                        right: 0,
                        fontSize: 9,
                        background: 'var(--secondary-bg)',
                        padding: 6,
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        zIndex: 20
                      }}>
                        {badge.requirement}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Recent Sessions Summary */}
          {score.recentSessionScores && score.recentSessionScores.length > 0 && (
            <div style={{
              padding: 16,
              background: 'rgba(147, 51, 234, 0.05)',
              borderRadius: 10,
              border: '1px solid rgba(147, 51, 234, 0.2)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                📊 Recent Sessions ({score.totalSessionsEvaluated})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                {score.recentSessionScores.slice(0, 5).map((session, idx) => (
                  <div key={idx} style={{
                    padding: 8,
                    background: 'var(--secondary-bg)',
                    borderRadius: 8,
                    textAlign: 'center',
                    fontSize: 10
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>
                      {session.moodPositivityPercent.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--base-text-secondary)' }}>mood</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates Received Section */}
          {certificates.length > 0 && (
            <div style={{
              marginTop: 32,
              borderTop: '1px solid rgba(123,92,245,0.2)',
              paddingTop: 24,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                🎓 CERTIFICATES RECEIVED
              </div>
              {certificates.map((cert, idx) => (
                <div key={idx}>
                  {/* Hidden certificate template */}
                  <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <CertificateTemplate 
                      ref={el => certRefs.current[idx] = el}
                      trainer={{ 
                        trainerName: score?.trainerName, 
                        tier: cert.tier,
                        scorePercentage: cert.scorePercentage,
                        totalSessionsEvaluated: score?.totalSessionsEvaluated,
                        consecutiveHighQualitySessions: score?.consecutiveHighQualitySessions
                      }} 
                      cert={cert} 
                    />
                  </div>

                  {/* Visible certificate card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      marginBottom: idx < certificates.length - 1 ? 10 : 0,
                      background: 'rgba(123,92,245,0.08)',
                      border: '1px solid rgba(123,92,245,0.2)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>
                      {cert.tier === 'platinum' ? '💎' :
                       cert.tier === 'gold' ? '🥇' :
                       cert.tier === 'silver' ? '🥈' : '🥉'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                        {cert.tier.charAt(0).toUpperCase() + cert.tier.slice(1)} Tier Certificate
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        Score {cert.scorePercentage}/100 · Issued by {cert.issuedBy} · {new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadCertificate(cert, idx)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(123,92,245,0.3)',
                        border: '1px solid rgba(123,92,245,0.5)',
                        borderRadius: 5,
                        color: '#fff',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(123,92,245,0.5)'
                        e.target.style.borderColor = 'rgba(123,92,245,0.8)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(123,92,245,0.3)'
                        e.target.style.borderColor = 'rgba(123,92,245,0.5)'
                      }}
                    >
                      ⬇️ Download
                    </button>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AppMagicCard>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </motion.div>
  )
}
