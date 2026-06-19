import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { addTrainee, loadBatches } from '../../data/ldTraineeStore'

const TRACK_OPTIONS = ['GET', 'PGET', 'STEP', 'LEAP']

const COLLEGE_SUGGESTIONS = [
  'IIT Bombay', 'NIT Trichy', 'VIT Vellore', 'BITS Pilani', 'IIIT Hyderabad', 'SRM Chennai', 'Amrita Coimbatore',
]

/**
 * Add a recruit to the queue or assign directly to a batch.
 */
export default function AddTraineeModal({ onClose, onAdded, defaultBatchId = '', defaultDestination = 'queue' }) {
  const [name, setName] = useState('')
  const [personalEmail, setPersonalEmail] = useState('')
  const [college, setCollege] = useState('')
  const [track, setTrack] = useState('GET')
  const [assessmentScore, setAssessmentScore] = useState(70)
  const [destination, setDestination] = useState(defaultDestination)
  const [batchId, setBatchId] = useState(defaultBatchId)
  const [saving, setSaving] = useState(false)

  const batches = loadBatches()

  const handleDestinationChange = (next) => {
    setDestination(next)
    if (next === 'batch' && !batchId && batches.length > 0) {
      setBatchId(batches[0].id)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (destination === 'batch' && !batchId) {
      onAdded(null, new Error('Choose a target batch'))
      return
    }
    setSaving(true)
    try {
      const result = addTrainee({
        name,
        personalEmail,
        college,
        track,
        assessmentScore,
        batchId: destination === 'batch' ? batchId : null,
      })
      onAdded(result)
      onClose()
    } catch (error) {
      onAdded(null, error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ba-modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="ba-modal"
        role="dialog"
        aria-labelledby="add-trainee-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ba-modal__header">
          <h3 id="add-trainee-title">Add recruit</h3>
          <button type="button" className="ba-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="ba-modal__lead">
          Add a new trainee to the recruitment queue or place them directly into a batch.
        </p>

        <form className="ba-modal__form" onSubmit={handleSubmit}>
          <label className="ba-field">
            <span>Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="ba-input"
              required
            />
          </label>
          <label className="ba-field">
            <span>Personal email</span>
            <input
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="ba-input"
              required
            />
          </label>
          <label className="ba-field">
            <span>College</span>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="College or university"
              className="ba-input"
              list="college-suggestions"
            />
            <datalist id="college-suggestions">
              {COLLEGE_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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
              <span>Assessment %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={assessmentScore}
                onChange={(e) => setAssessmentScore(Number(e.target.value))}
                className="ba-input"
              />
            </label>
          </div>

          <fieldset className="ba-destination-fieldset">
            <legend className="ba-destination-legend">Place recruit</legend>
            <label className="ba-destination-option">
              <input
                type="radio"
                name="destination"
                value="queue"
                checked={destination === 'queue'}
                onChange={() => handleDestinationChange('queue')}
              />
              <span>
                <strong>Recruitment queue</strong>
                <small>Awaiting batch assignment</small>
              </span>
            </label>
            <label className="ba-destination-option">
              <input
                type="radio"
                name="destination"
                value="batch"
                checked={destination === 'batch'}
                onChange={() => handleDestinationChange('batch')}
              />
              <span>
                <strong>Assign to batch directly</strong>
                <small>Skip the queue</small>
              </span>
            </label>
          </fieldset>

          {destination === 'batch' && (
            <label className="ba-field">
              <span>Target batch</span>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="ba-input"
                required
              >
                <option value="">Choose batch…</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.name} ({b.maverickCount}/{b.capacity ?? 12})
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="ba-modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Adding…' : destination === 'batch' ? 'Add to batch' : 'Add to queue'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
