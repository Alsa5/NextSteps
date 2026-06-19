import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Users, Plus, Layers, CheckSquare, Square, X, ClipboardList,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import PersonAvatar from '../../components/PersonAvatar'
import {
  assignTraineesToBatch,
  activateBatch,
  createBatch,
  getAvailableBatchSeats,
  getUnassignedTrainees,
  loadBatches,
  loadTrainees,
  saveTrainees,
} from '../../data/ldTraineeStore'
import AddTraineeModal from '../../components/ld/AddTraineeModal'
import { syncTraineeRegistry } from '../../config/trainee-registry-sync'

const TRACK_OPTIONS = ['GET', 'PGET', 'STEP', 'LEAP']

function CreateBatchModal({ selectedCount, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [track, setTrack] = useState('GET')
  const [trainer, setTrainer] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [capacity, setCapacity] = useState(12)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const batch = createBatch({ name, track, trainer, startDate, capacity })
      onCreated(batch)
      toast.success(`Batch ${batch.id} created`)
      onClose()
    } catch (error) {
      toast.error(error.message || 'Could not create batch')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ba-modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="ba-modal"
        role="dialog"
        aria-labelledby="create-batch-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ba-modal__header">
          <h3 id="create-batch-title">Create training batch</h3>
          <button type="button" className="ba-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="ba-modal__lead">
          {selectedCount > 0
            ? `${selectedCount} recruited student${selectedCount !== 1 ? 's' : ''} can be assigned after the batch is created.`
            : 'Create a batch first, then assign recruited students from the queue.'}
        </p>
        <form className="ba-modal__form" onSubmit={handleSubmit}>
          <label className="ba-field">
            <span>Batch name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Batch 18 — July GET Cohort"
              className="ba-input"
              required
            />
          </label>
          <div className="ba-field-row">
            <label className="ba-field">
              <span>Track</span>
              <select value={track} onChange={(e) => setTrack(e.target.value)} className="ba-input">
                {TRACK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <label className="ba-field">
              <span>Capacity</span>
              <input
                type="number"
                min={1}
                max={40}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="ba-input"
              />
            </label>
          </div>
          <label className="ba-field">
            <span>Lead trainer</span>
            <input
              type="text"
              value={trainer}
              onChange={(e) => setTrainer(e.target.value)}
              placeholder="Trainer name"
              className="ba-input"
            />
          </label>
          <label className="ba-field">
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ba-input"
              required
            />
          </label>
          <div className="ba-modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create batch'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function BatchAssignmentQueue() {
  const navigate = useNavigate()
  const [trainees, setTrainees] = useState(() => loadTrainees())
  const [batches, setBatches] = useState(() => loadBatches())
  const [search, setSearch] = useState('')
  const [trackFilter, setTrackFilter] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [targetBatchId, setTargetBatchId] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddTraineeModal, setShowAddTraineeModal] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const unassigned = useMemo(() => getUnassignedTrainees(trainees), [trainees])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return unassigned.filter((t) => {
      const matchTrack = trackFilter === 'all' || t.track === trackFilter
      const matchSearch = !q
        || t.name.toLowerCase().includes(q)
        || t.personalEmail.toLowerCase().includes(q)
        || t.college.toLowerCase().includes(q)
      return matchTrack && matchSearch
    })
  }, [unassigned, search, trackFilter])

  const formingBatches = batches.filter((b) => b.status === 'forming' || b.phase === 0)

  const batchSeats = useMemo(
    () => Object.fromEntries(
      batches.map((b) => [b.id, getAvailableBatchSeats(b.id, batches, trainees)]),
    ),
    [batches, trainees],
  )

  useEffect(() => {
    if (selectedIds.length === 0) return

    const currentSeats = targetBatchId ? batchSeats[targetBatchId] ?? 0 : 0
    if (targetBatchId && currentSeats >= selectedIds.length) return

    const fit = batches.find((b) => (batchSeats[b.id] ?? 0) >= selectedIds.length)
    const fallback = batches.find((b) => (batchSeats[b.id] ?? 0) > 0)
    const nextId = fit?.id ?? fallback?.id ?? ''
    if (nextId && nextId !== targetBatchId) {
      setTargetBatchId(nextId)
    }
  }, [selectedIds.length, batches, batchSeats, targetBatchId])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
      return
    }
    setSelectedIds(filtered.map((t) => t.id))
  }

  const runAssign = useCallback((batchId) => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one recruit from the queue')
      return
    }
    if (!batchId) {
      toast.error('Choose a target batch from the dropdown or side panel')
      return
    }
    const seats = batchSeats[batchId] ?? 0
    if (seats < selectedIds.length) {
      toast.error(
        `${batchId} only has ${seats} open seat${seats !== 1 ? 's' : ''} — pick another batch or create a new one`,
      )
      return
    }

    setAssigning(true)
    try {
      const result = assignTraineesToBatch(selectedIds, batchId, trainees, batches)
      setTrainees(result.trainees)
      setBatches(result.batches)
      setSelectedIds([])
      setTargetBatchId('')
      syncTraineeRegistry(result.trainees).catch(() => {})
      toast.success(`${result.assigned} student${result.assigned !== 1 ? 's' : ''} assigned to ${batchId}`)
    } catch (error) {
      toast.error(error.message || 'Assignment failed')
    } finally {
      setAssigning(false)
    }
  }, [selectedIds, batchSeats, trainees, batches])

  const handleAssign = () => runAssign(targetBatchId)

  const handleAssignToBatch = (batchId) => {
    setTargetBatchId(batchId)
    runAssign(batchId)
  }

  const handleBatchCreated = useCallback((batch) => {
    setBatches(loadBatches())
    setTargetBatchId(batch.id)
    setShowCreateModal(false)
  }, [])

  const handleTraineeAdded = useCallback((result, error) => {
    if (error) {
      toast.error(error.message || 'Could not add recruit')
      return
    }
    setTrainees(result.trainees)
    setBatches(result.batches)
    syncTraineeRegistry(result.trainees).catch(() => {})
    const { trainee } = result
    if (trainee.batch) {
      toast.success(`${trainee.name} added to ${trainee.batch}`)
      setTargetBatchId(trainee.batch)
    } else {
      toast.success(`${trainee.name} added to recruitment queue`)
    }
    setShowAddTraineeModal(false)
  }, [])

  const handleAssignAndOpenRoster = () => {
    saveTrainees(trainees)
    navigate('/trainee-roster')
  }

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length
  const assignReady = Boolean(
    targetBatchId
    && selectedIds.length > 0
    && (batchSeats[targetBatchId] ?? 0) >= selectedIds.length,
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="batch-assignment-page"
    >
      <MetaversePageHero
        role="ld"
        title="Recruitment Queue"
        subtitle="Recruited students waiting for a training batch — assign to an existing cohort or spin up a new one."
      />

      <div className="ba-stats">
        <div className="ba-stat-card ba-stat-card--highlight">
          <ClipboardList size={18} aria-hidden />
          <div>
            <span className="ba-stat-value">{unassigned.length}</span>
            <span className="ba-stat-label">Awaiting batch</span>
          </div>
        </div>
        <div className="ba-stat-card">
          <Layers size={18} aria-hidden />
          <div>
            <span className="ba-stat-value">{formingBatches.length}</span>
            <span className="ba-stat-label">Forming batches</span>
          </div>
        </div>
        <div className="ba-stat-card">
          <Users size={18} aria-hidden />
          <div>
            <span className="ba-stat-value">{selectedIds.length}</span>
            <span className="ba-stat-label">Selected</span>
          </div>
        </div>
      </div>

      <div className="ba-toolbar">
        <div className="trainee-search">
          <Search size={15} className="trainee-search__icon" />
          <input
            type="search"
            placeholder="Search name, email, college…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="trainee-search__input"
            aria-label="Search recruited students"
          />
        </div>
        <div className="ba-track-filters">
          {['all', ...TRACK_OPTIONS].map((track) => (
            <button
              key={track}
              type="button"
              className={`trainee-stat-chip${trackFilter === track ? ' active' : ''}`}
              onClick={() => setTrackFilter(track)}
            >
              {track === 'all' ? 'All tracks' : track}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary ba-add-recruit-btn"
          onClick={() => setShowAddTraineeModal(true)}
        >
          <Plus size={15} aria-hidden /> Add recruit
        </button>
      </div>

      {selectedIds.length > 0 && (
        <motion.div
          className="ba-action-bar"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="ba-action-bar__count">{selectedIds.length} selected</span>
          {!targetBatchId && (
            <span className="ba-action-bar__hint">Pick a batch below or in the sidebar →</span>
          )}
          <select
            value={targetBatchId}
            onChange={(e) => setTargetBatchId(e.target.value)}
            className="ba-select"
            aria-label="Target batch"
          >
            <option value="">Choose batch…</option>
            {batches.map((b) => {
              const seats = batchSeats[b.id] ?? 0
              return (
                <option key={b.id} value={b.id} disabled={seats === 0}>
                  {b.id} — {b.name} ({b.maverickCount}/{b.capacity ?? 12})
                  {seats === 0 ? ' · FULL' : ` · ${seats} open`}
                </option>
              )
            })}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            disabled={assigning}
            aria-disabled={!assignReady}
            onClick={handleAssign}
          >
            {assigning ? 'Assigning…' : 'Assign to batch'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={15} aria-hidden /> New batch
          </button>
        </motion.div>
      )}

      <div className="ba-layout">
        <div className="trainee-roster-table-wrap">
          <table className="trainee-table">
            <thead>
              <tr>
                <th aria-label="Select">
                  <button type="button" className="ba-check-btn" onClick={toggleSelectAll} aria-label={allSelected ? 'Deselect all' : 'Select all'}>
                    {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th>Recruit</th>
                <th>College</th>
                <th>Track</th>
                <th>Assessment</th>
                <th>Recruited</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isSelected = selectedIds.includes(t.id)
                return (
                  <tr
                    key={t.id}
                    className={`trainee-row${isSelected ? ' trainee-row--active' : ''}`}
                    onClick={() => toggleSelect(t.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleSelect(t.id)}
                    role="button"
                    aria-label={`Select ${t.name}`}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="ba-check-btn"
                        onClick={() => toggleSelect(t.id)}
                        aria-label={isSelected ? `Deselect ${t.name}` : `Select ${t.name}`}
                      >
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>
                    <td>
                      <div className="trainee-cell-name">
                        <PersonAvatar userId={t.id} size={32} title={t.name} />
                        <div>
                          <div className="trainee-name">{t.name}</div>
                          <div className="trainee-email">{t.personalEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.college}</td>
                    <td><span className="tag tag-violet">{t.track}</span></td>
                    <td>
                      <div className="trainee-score-bar">
                        <div
                          className="trainee-score-fill"
                          style={{
                            width: `${t.assessmentScore}%`,
                            background: t.assessmentScore >= 75 ? '#22c55e' : t.assessmentScore >= 55 ? '#f7c948' : '#ef7351',
                          }}
                        />
                        <span>{t.assessmentScore}%</span>
                      </div>
                    </td>
                    <td className="ba-dim">{t.recruitedDate}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="trainee-empty">
                    {unassigned.length === 0
                      ? 'All recruited students are assigned to batches.'
                      : 'No recruits match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="ba-side-panel">
          <h3>Available batches</h3>
          <p className="ba-side-panel__hint">Assign recruits to a forming batch or create a new cohort.</p>
          <button
            type="button"
            className="btn btn-outline ba-side-panel__create"
            onClick={() => setShowAddTraineeModal(true)}
          >
            <Plus size={15} aria-hidden /> Add recruit
          </button>
          <button
            type="button"
            className="btn btn-primary ba-side-panel__create"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={15} aria-hidden /> Create batch
          </button>
          <ul className="ba-batch-list">
            {batches.map((b) => {
              const seats = batchSeats[b.id] ?? 0
              const canAssignHere = selectedIds.length > 0 && seats >= selectedIds.length
              return (
              <li key={b.id} className={`ba-batch-card${targetBatchId === b.id ? ' ba-batch-card--active' : ''}`}>
                <button
                  type="button"
                  className="ba-batch-card__btn"
                  onClick={() => setTargetBatchId(b.id)}
                >
                  <div className="ba-batch-card__top">
                    <strong>{b.id}</strong>
                    <span className={`tag ${b.status === 'forming' ? 'tag-amber' : 'tag-green'}`}>
                      {b.status === 'forming' ? 'Forming' : 'Active'}
                    </span>
                  </div>
                  <div className="ba-batch-card__name">{b.name}</div>
                  <div className="ba-batch-card__meta">
                    {b.track} · {b.maverickCount}/{b.capacity ?? 12} seats · {seats} open · {b.trainer}
                  </div>
                </button>
                {b.status === 'forming' && (b.maverickCount ?? 0) > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary ba-batch-card__assign"
                    onClick={() => {
                      try {
                        activateBatch(b.id)
                        setBatches(loadBatches())
                        toast.success(`${b.id} is now active — visible on Ops Dashboard`)
                      } catch (err) {
                        toast.error(err.message)
                      }
                    }}
                  >
                    Launch batch → Active
                  </button>
                )}
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary ba-batch-card__assign"
                    disabled={assigning || !canAssignHere}
                    onClick={() => handleAssignToBatch(b.id)}
                  >
                    {canAssignHere
                      ? `Assign ${selectedIds.length} here`
                      : seats === 0 ? 'Batch full' : `Only ${seats} seat${seats !== 1 ? 's' : ''} left`}
                  </button>
                )}
              </li>
              )
            })}
          </ul>
          <button type="button" className="btn btn-ghost ba-side-link" onClick={handleAssignAndOpenRoster}>
            View full trainee roster →
          </button>
        </aside>
      </div>

      <AnimatePresence>
        {showAddTraineeModal && (
          <AddTraineeModal
            defaultBatchId={targetBatchId}
            defaultDestination={targetBatchId ? 'batch' : 'queue'}
            onClose={() => setShowAddTraineeModal(false)}
            onAdded={handleTraineeAdded}
          />
        )}
        {showCreateModal && (
          <CreateBatchModal
            selectedCount={selectedIds.length}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleBatchCreated}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
