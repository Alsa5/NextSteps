import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import CertificateTemplate from '../CertificateTemplate'
import { getTierColor, getTierDisplayName } from '../../lib/trainerTierUtils'

export default function TrainerDrawer({ trainer, isOpen, onClose, onAwardSuccess }) {
  const [awePoints, setAwePoints] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingCert, setSendingCert] = useState(false)
  const [certSent, setCertSent] = useState(false)
  const certRef = useRef()

  // Reset certSent when trainer changes
  useEffect(() => {
    setCertSent(false)
  }, [trainer?._id])

  const handleSendCertificate = async () => {
    setSendingCert(true)
    try {
      const token = sessionStorage.getItem('nextsteps_token')

      // Generate certificate image first
      let certificateImageBase64 = null
      try {
        if (certRef.current) {
          await new Promise(r => setTimeout(r, 300))
          const canvas = await html2canvas(certRef.current, {
            backgroundColor: null,
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
          })
          certificateImageBase64 = canvas.toDataURL('image/png').split(',')[1]
        }
      } catch (imgErr) {
        console.warn('[TrainerDrawer] Could not generate certificate image:', imgErr)
      }

      const res = await fetch('/api/v1/trainer-scores/send-certificate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: trainer._id,
          tier: trainer.tier,
          scorePercentage: trainer.scorePercentage,
          totalSessions: trainer.totalSessionsEvaluated,
          certificateImageBase64,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setCertSent(true)
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.4 } })
      toast.success(`Certificate sent to ${trainer.trainerName}! 🎓`)
    } catch (e) {
      console.error('[TrainerDrawer] Certificate send error:', e)
      toast.error('Failed to send certificate')
    } finally {
      setSendingCert(false)
    }
  }

  const handleDownloadCertificate = async () => {
    try {
      if (!certRef.current) {
        toast.error('Certificate template not ready')
        return
      }
      
      // Wait for fonts to load
      await new Promise(r => setTimeout(r, 500))
      
      const canvas = await html2canvas(certRef.current, {
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
      link.download = `NextSteps_Certificate_${trainer.trainerName?.replace(/\s+/g, '_') || 'Trainer'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Certificate downloaded!')
    } catch (e) {
      console.error('[TrainerDrawer] Download error:', e)
      toast.error('Failed to download certificate')
    }
  }

  const handleAward = async () => {
    if (!awePoints || !reason.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      const token = sessionStorage.getItem('nextsteps_token')
      
      const response = await fetch(`/api/v1/trainer-scores/${trainer._id}/award-points`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(awePoints),
          reason,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to award points: ${response.status}`)
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      toast.success('Recognition recorded!')
      setAwePoints('')
      setReason('')
      onAwardSuccess?.()
      onClose()
    } catch (error) {
      console.error('[TrainerDrawer] Error:', error)
      toast.error('Could not award points')
    } finally {
      setLoading(false)
    }
  }

  if (!trainer) return null

  return (
    <>
      {/* Hidden certificate template for rendering */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CertificateTemplate ref={certRef} trainer={trainer} cert={null} />
      </div>

      <motion.div
      initial={{ x: 400 }}
      animate={{ x: isOpen ? 0 : 400 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100%',
        width: 360,
        zIndex: 50,
        background: 'linear-gradient(135deg, rgba(20,15,40,0.95) 0%, rgba(10,5,30,0.98) 100%)',
        borderLeft: '1px solid rgba(123,92,245,0.3)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: 20,
        borderBottom: '1px solid rgba(123,92,245,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            {trainer.trainerName}
          </h2>
          <div style={{ fontSize: 12, color: getTierColor(trainer.tier), fontWeight: 700 }}>
            {getTierDisplayName(trainer.tier)} Trainer
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: 24,
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stats Card */}
        <div style={{
          background: 'rgba(123,92,245,0.15)',
          border: '1px solid rgba(123,92,245,0.2)',
          borderRadius: 10,
          padding: 14,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 700, letterSpacing: '0.5px' }}>
            CURRENT SCORE
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#7b5cf5', marginBottom: 12 }}>
            {trainer.scorePercentage}/100
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            ⭐ {trainer.awePoints} Recognition Points
          </div>
        </div>

        {/* Batch History Section */}
        {trainer.recentSessionScores?.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(123,92,245,0.15)',
            borderRadius: 10,
            padding: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
              RECENT BATCHES
            </div>
            {trainer.recentSessionScores.slice(0, 5).map((session, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: 12, marginBottom: 2 }}>
                    {session.batchId}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                    {new Date(session.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      color: session.moodPositivityPercent >= 70 ? '#4ade80'
                        : session.moodPositivityPercent >= 50 ? '#f5c542'
                        : '#f87171',
                      fontWeight: 700,
                      fontSize: 13,
                    }}>
                      {session.moodPositivityPercent?.toFixed(0)}%
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                      MOOD
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#7b5cf5', fontWeight: 700, fontSize: 13 }}>
                      {session.averageClarity?.toFixed(1)}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                      CLARITY
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13 }}>
                      {session.averagePace?.toFixed(1)}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                      PACE
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certification Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,197,66,0.08), rgba(123,92,245,0.08))',
          border: `1px solid ${getTierColor(trainer.tier)}44`,
          borderRadius: 10,
          padding: 14,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
            CERTIFICATION
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 32 }}>
              {trainer.tier === 'platinum' ? '💎'
                : trainer.tier === 'gold' ? '🥇'
                : trainer.tier === 'silver' ? '🥈'
                : '🥉'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: getTierColor(trainer.tier), marginBottom: 3 }}>
                {getTierDisplayName(trainer.tier)} Tier Certified
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                {trainer.totalSessionsEvaluated} sessions · {trainer.consecutiveHighQualitySessions > 0 ? `🔥 ${trainer.consecutiveHighQualitySessions} streak` : ' No current streak'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                Progress to next tier: {((trainer.progressToNextTier || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Progress bar to next tier */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 4, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 4,
              width: `${((trainer.progressToNextTier || 0) * 100).toFixed(0)}%`,
              background: `linear-gradient(90deg, ${getTierColor(trainer.tier)}, #7b5cf5)`,
              transition: 'width 0.6s ease',
            }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSendCertificate}
              disabled={sendingCert || certSent}
              style={{
                flex: 1,
                padding: '10px',
                background: certSent ? 'rgba(74,222,128,0.15)' : `linear-gradient(135deg, ${getTierColor(trainer.tier)}22, rgba(123,92,245,0.3))`,
                border: `1px solid ${certSent ? '#4ade80' : getTierColor(trainer.tier)}66`,
                borderRadius: 6,
                color: 'white',
                fontWeight: 700,
                fontSize: 11,
                cursor: sendingCert || certSent ? 'not-allowed' : 'pointer',
                opacity: sendingCert ? 0.6 : 1,
                letterSpacing: 0.5,
                transition: 'all 0.3s',
              }}
            >
              {certSent ? '✅ Sent!' : sendingCert ? 'Sending...' : '📮 Send'}
            </button>
            <button
              onClick={handleDownloadCertificate}
              style={{
                flex: 1,
                padding: '10px',
                background: `linear-gradient(135deg, ${getTierColor(trainer.tier)}33, rgba(123,92,245,0.2))`,
                border: `1px solid ${getTierColor(trainer.tier)}77`,
                borderRadius: 6,
                color: 'white',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                letterSpacing: 0.5,
                transition: 'all 0.3s',
              }}
            >
              ⬇️ Download
            </button>
          </div>
        </div>

        {/* Award Form */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
            AWE POINTS
          </label>
          <input
            type="number"
            value={awePoints}
            onChange={(e) => setAwePoints(e.target.value)}
            min="1"
            max="100"
            placeholder="e.g. 10"
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(123,92,245,0.3)',
              borderRadius: 6,
              color: 'white',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 8 }}>
            REASON FOR RECOGNITION
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What did they do well?"
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(123,92,245,0.3)',
              borderRadius: 6,
              color: 'white',
              fontSize: 14,
              fontFamily: 'inherit',
              minHeight: 100,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: 20,
        borderTop: '1px solid rgba(123,92,245,0.2)',
        display: 'flex',
        gap: 10,
      }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '12px',
            background: 'transparent',
            border: '1px solid rgba(123,92,245,0.3)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleAward}
          disabled={loading || !awePoints || !reason.trim()}
          style={{
            flex: 1,
            padding: '12px',
            background: 'rgba(123,92,245,0.7)',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !awePoints || !reason.trim() ? 0.5 : 1,
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Recording...' : '🏆 Recognize'}
        </button>
      </div>
    </motion.div>
    </>
  )
}
