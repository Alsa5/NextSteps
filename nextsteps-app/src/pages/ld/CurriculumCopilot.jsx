import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Brain, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { loadCurriculumInsights, approveCurriculumInsight } from '../../data/curriculumStore'

export default function CurriculumCopilot() {
  const [insights, setInsights] = useState(() => loadCurriculumInsights())

  const approveInsight = (id) => {
    setInsights(approveCurriculumInsight(id))
    toast.success('Approved — trainers notified in their notification feed.')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>🧠 Curriculum Copilot</h1>
        <p>AI-powered curriculum recommendations based on cross-batch feedback and transcript analysis</p>
      </div>

      <motion.div
        className="card highlight-card-warm"
        style={{ marginBottom: 24 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-16">
          <Brain size={40} color="var(--accent-violet)" />
          <div>
            <h3 style={{ marginBottom: 8 }}>AI Curriculum Analysis Summary</h3>
            <p style={{ fontSize: 14, color: 'var(--base-text-secondary)', lineHeight: 1.6 }}>
              {insights.filter((i) => i.status === 'pending').length} pending recommendations.
              Approved items create a trainer notification and appear in Session Analytics planning notes.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-16">
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            className="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderLeft: `4px solid ${insight.status === 'approved' ? 'var(--accent-emerald)' : insight.confidence >= 85 ? 'var(--accent-coral)' : 'var(--accent-amber)'}`,
            }}
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-12">
                {insight.confidence >= 85 ? (
                  <AlertTriangle size={18} color="var(--accent-coral)" />
                ) : (
                  <Clock size={18} color="var(--accent-amber)" />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{insight.module}</div>
                  <div className="text-sm text-secondary">{insight.issue}</div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xs text-secondary">Confidence</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: insight.confidence >= 85 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                    {insight.confidence}%
                  </div>
                </div>
                {insight.status === 'approved' ? (
                  <span className="tag tag-green"><CheckCircle size={12} /> Approved</span>
                ) : (
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => approveInsight(insight.id)}>
                    Approve
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--base-surface)' }}>
              <div className="text-xs text-secondary mb-8">💡 AI Recommendation</div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{insight.recommendation}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
