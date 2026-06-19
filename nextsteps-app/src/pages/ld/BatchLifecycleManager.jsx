import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { ChevronRight, AlertTriangle, CheckCircle, UserX } from 'lucide-react'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import PersonAvatar from '../../components/PersonAvatar'
import {
  loadBatches,
  getLifecycleTraineesForBatch,
  advanceBatchPhase,
  convertTrainee,
  letDownTrainee,
} from '../../data/ldTraineeStore'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const PHASE_LABELS = ['Pre-Onboarding', 'Spark: Soft Skills', 'Spark: Foundation Tech', 'Stream Training', 'Project Internship', 'Deployment', 'Post-Deploy Review']

const HEALTH_CONFIG = {
  green: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'On Track' },
  amber: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'At Risk' },
  red: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Critical' },
}

const LIFECYCLE_ACTIONS = ['advance_phase', 'separate_batch', 'convert', 'let_down', 'activate_hex_id']

export default function BatchLifecycleManager() {
  const [batches, setBatches] = useState(() => loadBatches())
  const [selectedBatchId, setSelectedBatchId] = useState(() => loadBatches()[0]?.id)
  const [trainees, setTrainees] = useState(() => getLifecycleTraineesForBatch(loadBatches()[0]?.id))
  const [selectedMaverick, setSelectedMaverick] = useState(null)
  const [actionModal, setActionModal] = useState(null)

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || batches[0]

  const refresh = (batchId = selectedBatchId) => {
    const nextBatches = loadBatches()
    setBatches(nextBatches)
    setTrainees(getLifecycleTraineesForBatch(batchId))
  }

  const selectBatch = (batch) => {
    setSelectedBatchId(batch.id)
    setTrainees(getLifecycleTraineesForBatch(batch.id))
  }

  const handleAction = async (action) => {
    try {
      if (action === 'advance_phase') {
        advanceBatchPhase(selectedBatch.id)
        toast.success(`${selectedBatch.name} advanced to phase ${selectedBatch.phase + 1}`)
      } else if (action === 'convert' && selectedMaverick) {
        convertTrainee(selectedMaverick.id)
        toast.success(`${selectedMaverick.name} converted — post-onboarding status applied`)
      } else if (action === 'let_down' && selectedMaverick) {
        letDownTrainee(selectedMaverick.id)
        toast.success(`${selectedMaverick.name} let-down recorded — removed from batch`)
      } else if (action === 'separate_batch') {
        toast.success('Split request logged — open Batch Composer to approve new groupings')
      }
      refresh()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    }
    setActionModal(null)
    setSelectedMaverick(null)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="ld"
          title="Batch Lifecycle Manager"
          subtitle="Track batch transitions, conversions, separations, and let-downs"
        />
      </motion.div>

      {/* Batch selector */}
      <motion.div variants={item} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {batches.map(batch => {
          const hc = HEALTH_CONFIG[batch.health] || HEALTH_CONFIG.green
          return (
            <motion.button
              key={batch.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => selectBatch(batch)}
              style={{
                padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                border: `1px solid ${selectedBatch?.id === batch.id ? 'var(--brand-violet)' : 'rgba(255,255,255,0.08)'}`,
                background: selectedBatch?.id === batch.id ? 'rgba(123,92,245,0.15)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{batch.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: hc.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{hc.label} · Phase {batch.phase}</span>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {selectedBatch && (
        <>
          {/* Batch overview */}
          <motion.div variants={item}>
            <AppMagicCard className="card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginBottom: 6 }}>{selectedBatch.name}</h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      ['Phase', PHASE_LABELS[selectedBatch.phase]],
                      ['Track', selectedBatch.track],
                      ['Mavericks', selectedBatch.maverickCount],
                      ['Feedback', `${selectedBatch.feedbackCompletion}%`],
                      ['Avg Readiness', selectedBatch.avgReadiness || '—'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActionModal('advance_phase')}
                    className="btn btn-primary"
                    style={{ fontSize: 13, padding: '8px 14px' }}
                    disabled={selectedBatch.phase >= 6}
                  >
                    <ChevronRight size={14} /> Advance Phase
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActionModal('separate_batch')}
                    style={{
                      fontSize: 13, padding: '8px 14px', borderRadius: 8,
                      border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.1)',
                      color: '#fcd34d', cursor: 'pointer',
                    }}
                  >
                    Split Batch
                  </motion.button>
                </div>
              </div>
            </AppMagicCard>
          </motion.div>

          {/* Phase timeline */}
          <motion.div variants={item}>
            <AppMagicCard className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h4 style={{ marginBottom: 14 }}>Phase Progress</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
                {PHASE_LABELS.map((name, ph) => (
                  <div key={ph} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 80,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: ph < selectedBatch.phase ? 'var(--brand-violet)' : ph === selectedBatch.phase ? 'var(--brand-amber)' : 'rgba(255,255,255,0.08)',
                        color: ph <= selectedBatch.phase ? '#fff' : 'rgba(255,255,255,0.25)',
                        fontSize: 13, fontWeight: 700, border: ph === selectedBatch.phase ? '2px solid var(--brand-amber)' : '2px solid transparent',
                      }}>
                        {ph < selectedBatch.phase ? <CheckCircle size={14} /> : ph}
                      </div>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.3, maxWidth: 70 }}>
                        {name}
                      </span>
                    </div>
                    {ph < PHASE_LABELS.length - 1 && (
                      <div style={{
                        width: 20, height: 2, background: ph < selectedBatch.phase ? 'var(--brand-violet)' : 'rgba(255,255,255,0.08)',
                        flexShrink: 0, marginBottom: 20,
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </AppMagicCard>
          </motion.div>

          {/* Maverick table */}
          <motion.div variants={item}>
            <h3 style={{ marginBottom: 12 }}>Mavericks in this Batch</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trainees.map(mav => {
                const lifecycleTag = mav.lifecycleStatus === 'converted'
                  ? { label: 'Converted', color: '#22c55e' }
                  : mav.lifecycleStatus === 'let_down' || mav.status === 'let-down'
                    ? { label: 'Let-down', color: '#ef4444' }
                    : mav.status === 'post-onboarding'
                      ? { label: 'Post-onboarding', color: '#60a5fa' }
                      : null
                return (
                  <AppMagicCard key={mav.id} className="card" style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <PersonAvatar userId={mav.id} size={40} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{mav.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                          {mav.track} · Phase {mav.phase} · Readiness {mav.readinessScore}
                          {lifecycleTag && (
                            <span style={{ marginLeft: 8, color: lifecycleTag.color, fontWeight: 600 }}>
                              · {lifecycleTag.label}
                            </span>
                          )}
                        </div>
                        {mav.lifecycleNote && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{mav.lifecycleNote}</div>
                        )}
                      </div>
                      {mav.riskFlag && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444' }}>
                          <AlertTriangle size={14} /> At Risk
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelectedMaverick(mav); setActionModal('convert') }}
                          disabled={mav.lifecycleStatus === 'converted' || mav.status === 'let-down'}
                          style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                            border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.1)',
                            color: '#86efac',
                          }}
                        >
                          <CheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Convert
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelectedMaverick(mav); setActionModal('let_down') }}
                          disabled={mav.status === 'let-down'}
                          style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                            border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                            color: '#fca5a5',
                          }}
                        >
                          <UserX size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Let-down
                        </motion.button>
                      </div>
                    </div>
                  </AppMagicCard>
                )
              })}
            </div>
          </motion.div>
        </>
      )}

      {/* Action modal */}
      <AnimatePresence>
        {actionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setActionModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#1a1730', border: '1px solid rgba(123,92,245,0.3)', borderRadius: 20,
                padding: 32, maxWidth: 440, width: '100%',
              }}
            >
              {actionModal === 'convert' && selectedMaverick && (
                <>
                  <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🎓</div>
                  <h3 style={{ textAlign: 'center', marginBottom: 8 }}>Convert {selectedMaverick.name}?</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20, lineHeight: 1.7 }}>
                    This will mark training as complete, trigger Hexaware email provisioning, and flip auth to Hexaware SSO. The Maverick's journey data is fully preserved.
                  </p>
                </>
              )}
              {actionModal === 'let_down' && selectedMaverick && (
                <>
                  <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
                  <h3 style={{ textAlign: 'center', marginBottom: 8 }}>Let-down {selectedMaverick.name}?</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20, lineHeight: 1.7 }}>
                    This will revoke platform access and update the LOI status. This action cannot be undone. A formal communication will be sent to the Maverick.
                  </p>
                </>
              )}
              {actionModal === 'advance_phase' && (
                <>
                  <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⏭️</div>
                  <h3 style={{ textAlign: 'center', marginBottom: 8 }}>Advance {selectedBatch.name} to Phase {selectedBatch.phase + 1}?</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20, lineHeight: 1.7 }}>
                    All Mavericks in this batch will move to {PHASE_LABELS[selectedBatch.phase + 1]}. Their next phase timeline and sessions will be updated automatically.
                  </p>
                </>
              )}
              {actionModal === 'separate_batch' && (
                <>
                  <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>✂️</div>
                  <h3 style={{ textAlign: 'center', marginBottom: 8 }}>Split {selectedBatch.name}?</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20, lineHeight: 1.7 }}>
                    This will create a mid-program separation event. The Batch Composer will propose new groupings for approval. All XP and data is preserved for each Maverick.
                  </p>
                </>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleAction(actionModal)}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
