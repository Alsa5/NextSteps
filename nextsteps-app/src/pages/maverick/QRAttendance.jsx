import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QrCode, CheckCircle, Clock, Zap, Camera } from 'lucide-react'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import mockData from '../../data/mockData.json'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const SESSION_QR_CODE = 'NS-SES-003-2025-PRIYA'

export default function QRAttendance() {
  const user = mockData.currentUser
  const upcoming = mockData.sessions.find(s => s.status === 'upcoming')
  const recentSessions = mockData.sessions.filter(s => s.status === 'completed').slice(0, 3)

  const [scanState, setScanState] = useState('idle') // idle | scanning | success | error
  const [inputCode, setInputCode] = useState('')
  const [xpEarned, setXpEarned] = useState(false)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    if (scanState === 'scanning') {
      setCountdown(3)
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setScanState('success')
            setXpEarned(true)
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [scanState])

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (inputCode.trim().toUpperCase() === SESSION_QR_CODE) {
      setScanState('success')
      setXpEarned(true)
    } else {
      setScanState('error')
      setTimeout(() => setScanState('idle'), 2000)
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="maverick"
          title="QR Attendance"
          subtitle="Scan your session QR to verify presence and earn 50 XP"
        />
      </motion.div>

      {/* Active session */}
      {upcoming && (
        <motion.div variants={item}>
          <AppMagicCard className="card card-accent-soft" style={{ marginBottom: 24, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Active Session
                </div>
                <h3 style={{ marginBottom: 4 }}>{upcoming.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  {upcoming.trainer} · {upcoming.date} at {upcoming.time} · {upcoming.duration}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  Topic: {upcoming.topic}
                </p>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: 20, background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.35)', fontSize: 12, color: '#22c55e', fontWeight: 600,
              }}>
                🟢 Live Now
              </div>
            </div>
          </AppMagicCard>
        </motion.div>
      )}

      {/* QR Scanner */}
      <motion.div variants={item}>
        <AppMagicCard className="card" style={{ marginBottom: 24, padding: 32, textAlign: 'center' }}>
          <AnimateSuccess state={scanState} xpEarned={xpEarned} countdown={countdown} />

          {scanState === 'idle' && (
            <>
              <div style={{
                width: 180, height: 180, margin: '0 auto 20px',
                border: '2px dashed rgba(123,92,245,0.4)',
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(123,92,245,0.05)',
                position: 'relative',
              }}>
                {/* QR corners */}
                {['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].map(corner => (
                  <div key={corner} style={{
                    position: 'absolute',
                    width: 24, height: 24,
                    borderColor: 'var(--brand-violet)',
                    borderStyle: 'solid',
                    borderWidth: corner.includes('top') ? '3px 0 0 3px' : '0 3px 3px 0',
                    borderTopWidth: corner.includes('top') ? 3 : 0,
                    borderBottomWidth: corner.includes('bottom') ? 3 : 0,
                    borderLeftWidth: corner.includes('Left') ? 3 : 0,
                    borderRightWidth: corner.includes('Right') ? 3 : 0,
                    top: corner.includes('top') ? 8 : 'auto',
                    bottom: corner.includes('bottom') ? 8 : 'auto',
                    left: corner.includes('Left') ? 8 : 'auto',
                    right: corner.includes('Right') ? 8 : 'auto',
                    borderRadius: corner.includes('top') && corner.includes('Left') ? '4px 0 0 0' :
                      corner.includes('top') ? '0 4px 0 0' : corner.includes('Left') ? '0 0 0 4px' : '0 0 4px 0',
                  }} />
                ))}
                <QrCode size={64} style={{ color: 'rgba(255,255,255,0.2)' }} />
              </div>

              <motion.button
                onClick={() => setScanState('scanning')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
                style={{ marginBottom: 16 }}
              >
                <Camera size={16} /> Simulate QR Scan
              </motion.button>

              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>— or enter code manually —</div>

              <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8, maxWidth: 320, margin: '0 auto' }}>
                <input
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  placeholder={`Try: ${SESSION_QR_CODE}`}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10,
                    border: `1px solid ${scanState === 'error' ? '#ef4444' : 'rgba(123,92,245,0.35)'}`,
                    background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 13, outline: 'none',
                  }}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary"
                  style={{ flexShrink: 0 }}
                >
                  Submit
                </motion.button>
              </form>
              {scanState === 'error' && (
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8 }}>Invalid code — check with your trainer.</p>
              )}
            </>
          )}
        </AppMagicCard>
      </motion.div>

      {/* Recent attendance history */}
      <motion.div variants={item}>
        <h3 style={{ marginBottom: 12 }}>Recent Sessions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentSessions.map(session => (
            <AppMagicCard key={session.id} className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <CheckCircle size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{session.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{session.date} · {session.trainer}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--brand-amber)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={12} /> +50 XP
              </div>
            </AppMagicCard>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function AnimateSuccess({ state, xpEarned, countdown }) {
  if (state === 'scanning') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
        <h3>Scanning…</h3>
        {countdown !== null && (
          <motion.div
            key={countdown}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: 48, fontWeight: 900, color: 'var(--brand-amber)' }}
          >
            {countdown}
          </motion.div>
        )}
      </motion.div>
    )
  }

  if (state === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: '20px 0' }}>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: 64, marginBottom: 12 }}
        >
          ✅
        </motion.div>
        <h2 style={{ color: '#22c55e', marginBottom: 8 }}>Attendance Verified!</h2>
        {xpEarned && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: 'var(--brand-amber)', fontWeight: 700, fontSize: 18 }}
          >
            <Zap size={16} style={{ verticalAlign: 'middle' }} /> +50 XP earned
          </motion.p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 8 }}>
          Your attendance has been recorded for this session.
        </p>
      </motion.div>
    )
  }

  return null
}
