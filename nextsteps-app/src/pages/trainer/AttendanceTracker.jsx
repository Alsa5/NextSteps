import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import mockData from '../../data/mockData.json'
import AppMagicCard from '../../components/AppMagicCard'

export default function AttendanceTracker() {
  const batchMavericks = mockData.mavericks.filter(m => m.batch === 'B-2025-13')
  const sessions = mockData.sessions.filter(s => s.batch === 'B-2025-13')

  const [attendanceData] = useState(
    batchMavericks.map(m => ({
      ...m,
      sessions: sessions.map(s => ({
        sessionId: s.id,
        sessionTitle: s.title,
        attended: Math.random() > 0.15,
        feedbackSubmitted: Math.random() > 0.25,
      }))
    }))
  )

  const sendReminder = (name) => {
    toast.success(`Reminder sent to ${name}!`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>🗓️ Attendance & Completion Tracker</h1>
        <p>Track attendance and feedback submission status per session</p>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <AppMagicCard className="stat-card">
          <div className="stat-icon emerald">✅</div>
          <div>
            <div className="stat-value">92%</div>
            <div className="stat-label">Avg Attendance</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon violet">📝</div>
          <div>
            <div className="stat-value">83%</div>
            <div className="stat-label">Feedback Completion</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon amber">🎯</div>
          <div>
            <div className="stat-value">75-80%</div>
            <div className="stat-label">Target Rate</div>
          </div>
        </AppMagicCard>
      </div>

      {/* Attendance Table */}
      <AppMagicCard className="card" style={{ overflowX: 'auto' }}>
        <div className="card-header">
          <div className="card-title">📋 Batch 13 — Session Tracker</div>
          <button className="btn btn-sm btn-secondary" onClick={() => toast.success('Bulk reminder sent to all non-responders!')}>
            <Bell size={14} /> Send Bulk Reminder
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Maverick</th>
              {sessions.filter(s => s.status === 'completed').map(s => (
                <th key={s.id} style={{ textAlign: 'center', fontSize: 10 }}>
                  {s.title.split(' ').slice(0, 2).join(' ')}
                </th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                {m.sessions.filter((_, i) => sessions[i]?.status === 'completed').map((s, i) => (
                  <td key={i} style={{ textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-4">
                      {s.attended ? (
                        <CheckCircle size={16} color="var(--accent-emerald)" />
                      ) : (
                        <XCircle size={16} color="var(--accent-coral)" />
                      )}
                      <span style={{ fontSize: 10, color: s.feedbackSubmitted ? 'var(--accent-emerald)' : 'var(--accent-coral)' }}>
                        {s.feedbackSubmitted ? '📝' : '❌'}
                      </span>
                    </div>
                  </td>
                ))}
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => sendReminder(m.name)}>
                    <Bell size={12} /> Remind
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-16 mt-16" style={{ fontSize: 12, color: 'var(--base-text-secondary)' }}>
          <span><CheckCircle size={12} color="var(--accent-emerald)" style={{ verticalAlign: 'middle' }} /> = Attended</span>
          <span><XCircle size={12} color="var(--accent-coral)" style={{ verticalAlign: 'middle' }} /> = Absent</span>
          <span>📝 = Feedback submitted</span>
          <span>❌ = Feedback missing</span>
        </div>
      </AppMagicCard>
    </motion.div>
  )
}
