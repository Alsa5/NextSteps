import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle, Users, ChevronDown, ChevronUp, RefreshCw, Check, Upload, GitMerge } from 'lucide-react'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import PersonAvatar from '../../components/PersonAvatar'
import BatchSegregationPanel from '../../components/ld/BatchSegregationPanel'
import mockData from '../../data/mockData.json'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const AI_PROPOSALS = [
  {
    id: 'batch-a',
    name: 'Proposed Batch A — High Proficiency',
    track: 'PGET',
    stream: 'Product Engineering',
    rationale: 'Strong Java and REST API foundations. Resume analysis shows 3 internship-grade projects. High CGPA cohort. Recommended for fast-track stream training.',
    confidence: 92,
    mavericks: ['mav-004', 'mav-002', 'mav-006'],
    color: '#22c55e',
  },
  {
    id: 'batch-b',
    name: 'Proposed Batch B — Core GET Track',
    track: 'GET',
    stream: null,
    rationale: 'Balanced skill distribution. SQL and HTML/CSS competency above average. No advanced certifications detected. Standard 11-week Foundation track recommended.',
    confidence: 87,
    mavericks: ['mav-001', 'mav-005', 'mav-009'],
    color: '#4361EE',
  },
  {
    id: 'batch-c',
    name: 'Proposed Batch C — Needs Support',
    track: 'GET',
    stream: null,
    rationale: 'Limited programming exposure detected in resumes. Recommend extended Foundation phase (11W) with additional SQL mentoring sessions. Early warning monitoring enabled.',
    confidence: 78,
    mavericks: ['mav-003', 'mav-007', 'mav-008'],
    color: '#f97316',
  },
]

function SkillBar({ label, value }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--brand-violet), var(--brand-blue))' }}
        />
      </div>
    </div>
  )
}

function ProposalCard({ proposal, onApprove, onReject, approved, rejected }) {
  const [expanded, setExpanded] = useState(false)
  const mavericks = mockData.mavericks.filter((m) => proposal.mavericks.includes(m.id))
  const avgReadiness = Math.round(mavericks.reduce((s, m) => s + m.readinessScore, 0) / mavericks.length)

  return (
    <AppMagicCard className="card" style={{
      padding: 20, marginBottom: 16,
      border: `1px solid ${approved ? 'rgba(34,197,94,0.4)' : rejected ? 'rgba(239,68,68,0.3)' : `${proposal.color}33`}`,
      background: approved ? 'rgba(34,197,94,0.05)' : rejected ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <h3 style={{ fontSize: 15, margin: 0 }}>{proposal.name}</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, background: `${proposal.color}22`, border: `1px solid ${proposal.color}44`, color: proposal.color, fontWeight: 600 }}>
              {proposal.track}
            </span>
            {proposal.stream && (
              <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, background: 'rgba(123,92,245,0.15)', border: '1px solid rgba(123,92,245,0.3)', color: '#c4b5fd' }}>
                {proposal.stream}
              </span>
            )}
            <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              {mavericks.length} Mavericks · Avg Readiness {avgReadiness}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 10 }}>
            {proposal.rationale}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>AI Confidence:</span>
            <div style={{ flex: 1, maxWidth: 120, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${proposal.confidence}%`, height: '100%', borderRadius: 3, background: proposal.color }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: proposal.color }}>{proposal.confidence}%</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {!approved && !rejected && (
            <>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onApprove(proposal.id)}
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                <Check size={14} /> Approve
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onReject(proposal.id)}
                style={{
                  fontSize: 13, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)',
                  background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer',
                }}
              >
                Reject
              </motion.button>
            </>
          )}
          {approved && (
            <div style={{ color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <CheckCircle size={16} /> Approved
            </div>
          )}
          {rejected && (
            <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: 13 }}>✕ Rejected</div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Hide' : 'View'} Maverick breakdown
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {mavericks.map((m) => (
                  <div key={m.id} style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <PersonAvatar userId={m.id} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{m.track}</div>
                      </div>
                    </div>
                    <SkillBar label="Readiness" value={m.readinessScore} />
                    <SkillBar label="Quiz Avg" value={m.quizAvg} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppMagicCard>
  )
}

function ApprovePublishTab() {
  const [generating, setGenerating] = useState(false)
  const [approved, setApproved] = useState([])
  const [rejected, setRejected] = useState([])
  const [published, setPublished] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    setApproved([])
    setRejected([])
    setPublished(false)
    await new Promise((r) => setTimeout(r, 2000))
    setGenerating(false)
  }

  const allDecided = AI_PROPOSALS.every((p) => approved.includes(p.id) || rejected.includes(p.id))

  return (
    <>
      <AppMagicCard className="card" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>AI Batch Proposals</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {mockData.mavericks.length} Maverick profiles · Review and approve proposed groupings
          </div>
        </div>
        <motion.button
          onClick={handleGenerate}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="btn btn-primary"
          disabled={generating}
        >
          {generating ? (
            <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
          ) : (
            <><Sparkles size={14} /> Regenerate Proposals</>
          )}
        </motion.button>
      </AppMagicCard>

      <div className="grid-3" style={{ marginBottom: 24, gap: 12 }}>
        {[
          { label: 'Mavericks to place', value: mockData.mavericks.length, icon: '👤' },
          { label: 'AI proposals', value: AI_PROPOSALS.length, icon: '🤖' },
          { label: 'Approved', value: approved.length, icon: '✅' },
        ].map((stat) => (
          <AppMagicCard key={stat.label} className="stat-card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{stat.label}</div>
          </AppMagicCard>
        ))}
      </div>

      {AI_PROPOSALS.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          onApprove={(id) => setApproved((prev) => [...prev, id])}
          onReject={(id) => setRejected((prev) => [...prev, id])}
          approved={approved.includes(proposal.id)}
          rejected={rejected.includes(proposal.id)}
        />
      ))}

      {allDecided && !published && (
        <AppMagicCard className="card card-accent-soft" style={{ padding: 24, textAlign: 'center', marginTop: 8 }}>
          <h3 style={{ marginBottom: 8 }}>Ready to publish {approved.length} approved batch{approved.length !== 1 ? 'es' : ''}?</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
            Mavericks notified via email. Trainers assigned automatically. Launch batches from Recruitment Queue.
          </p>
          <motion.button
            onClick={() => setPublished(true)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="btn btn-primary"
          >
            <Users size={16} /> Publish Batch Assignments
          </motion.button>
        </AppMagicCard>
      )}

      {published && (
        <AppMagicCard className="card" style={{ padding: 24, textAlign: 'center', marginTop: 8, border: '1px solid rgba(34,197,94,0.3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h3 style={{ color: '#22c55e', marginBottom: 8 }}>Batches Published!</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            {approved.length} batch{approved.length !== 1 ? 'es have' : ' has'} been created. Proceed to Recruitment Queue to launch.
          </p>
        </AppMagicCard>
      )}
    </>
  )
}

export default function BatchComposer() {
  const [tab, setTab] = useState('segregation')

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="ld"
          title="Batch Composer"
          subtitle="Upload resumes for AI segregation, then approve and publish batch groupings"
        />
      </motion.div>

      <motion.div variants={item} className="bc-tabs">
        <button
          type="button"
          className={`bc-tab${tab === 'segregation' ? ' bc-tab--active' : ''}`}
          onClick={() => setTab('segregation')}
        >
          <Upload size={15} /> AI Segregation Input
        </button>
        <button
          type="button"
          className={`bc-tab${tab === 'approve' ? ' bc-tab--active' : ''}`}
          onClick={() => setTab('approve')}
        >
          <GitMerge size={15} /> Approve & Publish
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === 'segregation' && (
          <motion.div key="seg" variants={item} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>
            <BatchSegregationPanel onApproved={() => setTab('approve')} />
          </motion.div>
        )}
        {tab === 'approve' && (
          <motion.div key="app" variants={item} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <ApprovePublishTab />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
