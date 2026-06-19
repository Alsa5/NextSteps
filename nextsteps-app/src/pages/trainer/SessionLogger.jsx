import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { QrCode, Clock, Play, Square } from 'lucide-react'
import AppMagicCard from '../../components/AppMagicCard'

export default function SessionLogger() {
  const [form, setForm] = useState({
    title: '', topic: '', duration: '2 hours', phase: '2', batch: 'B-2025-13', materials: ''
  })
  const [isLive, setIsLive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [showQR, setShowQR] = useState(false)

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const startSession = () => {
    if (!form.title || !form.topic) { toast.error('Please fill in session title and topic'); return }
    setIsLive(true)
    setShowQR(true)
    toast.success('Session started! QR code generated for attendance.')
    const interval = setInterval(() => setTimer(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }

  const endSession = () => {
    setIsLive(false)
    toast.success('Session ended! Pulse feedback is now open for Mavericks.')
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>📋 Session Logger</h1>
        <p>Create and manage training sessions in under 2 minutes</p>
      </div>

      <div className="grid-2">
        {/* Form */}
        <AppMagicCard className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>New Session</div>

          <div className="form-group">
            <label className="form-label">Session Title</label>
            <input className="form-input" value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="e.g., Java OOP Fundamentals" />
          </div>

          <div className="form-group">
            <label className="form-label">Topic</label>
            <input className="form-input" value={form.topic} onChange={e => handleChange('topic', e.target.value)} placeholder="e.g., Classes, Objects, Inheritance" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <select className="form-input" value={form.duration} onChange={e => handleChange('duration', e.target.value)}>
                <option>1 hour</option>
                <option>1.5 hours</option>
                <option>2 hours</option>
                <option>3 hours</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phase</label>
              <select className="form-input" value={form.phase} onChange={e => handleChange('phase', e.target.value)}>
                <option value="1">Phase 1: Soft Skills</option>
                <option value="2">Phase 2: Foundation Tech</option>
                <option value="3">Phase 3: Stream Training</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Batch</label>
            <select className="form-input" value={form.batch} onChange={e => handleChange('batch', e.target.value)}>
              <option value="B-2025-13">Batch 13 - Jan 2025</option>
              <option value="B-2025-14">Batch 14 - Feb 2025</option>
              <option value="B-2025-15">Batch 15 - Mar 2025</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Materials Link (optional)</label>
            <input className="form-input" value={form.materials} onChange={e => handleChange('materials', e.target.value)} placeholder="https://..." />
          </div>

          {!isLive ? (
            <motion.button className="btn btn-primary btn-lg w-full" onClick={startSession} whileHover={{ scale: 1.02 }} style={{ width: '100%', justifyContent: 'center' }}>
              <Play size={18} /> Start Session
            </motion.button>
          ) : (
            <motion.button className="btn btn-lg w-full" onClick={endSession} whileHover={{ scale: 1.02 }}
              style={{ width: '100%', justifyContent: 'center', background: 'var(--accent-coral)', color: 'white' }}>
              <Square size={18} /> End Session
            </motion.button>
          )}
        </AppMagicCard>

        {/* Live Panel */}
        <div className="flex flex-col gap-20">
          {isLive && (
            <motion.div
              className="card highlight-card-mint"
              style={{ textAlign: 'center' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: 8 }}>
                🔴 LIVE SESSION
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--base-text)' }}>
                {formatTime(timer)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--base-text-secondary)', marginTop: 8 }}>{form.title}</div>
            </motion.div>
          )}

          {/* QR Code */}
          <AppMagicCard className="card" style={{ textAlign: 'center' }}>
            <div className="card-title" style={{ marginBottom: 16 }}>📱 Attendance QR Code</div>
            {showQR ? (
              <div>
                <svg width="200" height="200" viewBox="0 0 200 200" style={{ margin: '0 auto' }}>
                  <rect width="200" height="200" fill="white" rx="12" />
                  {/* Simulated QR pattern */}
                  {Array.from({ length: 10 }, (_, r) =>
                    Array.from({ length: 10 }, (_, c) => {
                      const filled = (r + c) % 3 !== 0 || (r < 3 && c < 3) || (r < 3 && c > 6) || (r > 6 && c < 3)
                      return filled ? (
                        <rect key={`${r}-${c}`} x={20 + c * 16} y={20 + r * 16} width="14" height="14" rx="2" fill="#2D2A32" />
                      ) : null
                    })
                  )}
                  {/* Corner squares */}
                  <rect x="16" y="16" width="52" height="52" rx="4" fill="none" stroke="#8B5CF6" strokeWidth="4" />
                  <rect x="132" y="16" width="52" height="52" rx="4" fill="none" stroke="#8B5CF6" strokeWidth="4" />
                  <rect x="16" y="132" width="52" height="52" rx="4" fill="none" stroke="#8B5CF6" strokeWidth="4" />
                </svg>
                <p style={{ fontSize: 12, color: 'var(--base-text-secondary)', marginTop: 12 }}>
                  Mavericks scan this to mark attendance (+50 XP)
                </p>
              </div>
            ) : (
              <div style={{ padding: 40, color: 'var(--base-text-secondary)' }}>
                <QrCode size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <p>Start a session to generate QR code</p>
              </div>
            )}
          </AppMagicCard>
        </div>
      </div>
    </motion.div>
  )
}
