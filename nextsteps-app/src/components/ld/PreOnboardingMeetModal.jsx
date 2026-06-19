import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, X, Calendar, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import mockData from '../../data/mockData.json'
import { createPreOnboardingSession } from '../../services/sessionApi'
import { addNotification } from '../../data/appNotifications'

const trainerEmailFor = (name) =>
  `${name.toLowerCase().replace(/\s+/g, '.')}@hexaware.com`

export default function PreOnboardingMeetModal({ open, onClose, batches, trainees, onCreated }) {
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '')
  const [title, setTitle] = useState('Pre-Onboarding Orientation')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const preOnboardingTrainees = useMemo(
    () =>
      trainees.filter(
        (t) =>
          t.batch === batchId &&
          (t.status === 'pre-onboarding' || (t.status === 'recruited' && t.batch)),
      ),
    [trainees, batchId],
  )

  const trainer = useMemo(() => {
    return mockData.trainers.find((t) => t.batches?.includes(batchId)) ?? mockData.trainers[0]
  }, [batchId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!batchId || !scheduledAt || preOnboardingTrainees.length === 0) {
      toast.error('Select a batch with pre-onboarding trainees and a session time')
      return
    }

    setSubmitting(true)
    try {
      const result = await createPreOnboardingSession({
        title,
        batchId,
        trainerId: trainer.id,
        trainerName: trainer.name,
        trainerEmail: trainerEmailFor(trainer.name),
        scheduledAt: new Date(scheduledAt).toISOString(),
        recipients: preOnboardingTrainees.map((t) => ({
          email: t.personalEmail,
          name: t.name,
        })),
      })

      addNotification({
        role: 'ld',
        title: 'Meet created & invites sent',
        body: `${title} — ${result.session.meetLink}`,
        link: '/pre-onboarding-sessions',
        meta: { sessionId: result.session.id },
      })

      toast.success(
        result.mail.delivered
          ? `Meet created — ${result.mail.sentCount} emails sent`
          : `Meet created — invites logged (configure SMTP to email)`,
      )
      onCreated?.(result.session)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to create meet')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="ba-modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="ba-modal ba-modal--wide pre-onboarding-meet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meet-modal-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="ba-modal__header">
          <h3 id="meet-modal-title">
            <Video size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Schedule Google Meet
          </h3>
          <button type="button" className="ba-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="ba-modal__lead">Pre-onboarding orientation for trainees not yet onboarded</p>

        <form onSubmit={handleSubmit} className="ba-modal__form">
          <label className="ba-field">
            <span>Batch</span>
            <select value={batchId} onChange={(e) => setBatchId(e.target.value)} className="ba-input">
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} — {b.track}
                </option>
              ))}
            </select>
          </label>

          <label className="ba-field">
            <span>Session title</span>
            <input
              className="ba-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="ba-field">
            <span>
              <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Scheduled time
            </span>
            <input
              type="datetime-local"
              className="ba-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </label>

          <div className="meet-modal-trainer">
            <strong>Trainer:</strong> {trainer?.name} ({trainerEmailFor(trainer?.name ?? '')})
          </div>

          <div className="meet-modal-audience">
            <Users size={14} />
            <span>
              {preOnboardingTrainees.length} pre-onboarding trainee
              {preOnboardingTrainees.length !== 1 ? 's' : ''} will receive meet link by email & in-app
              notification
            </span>
          </div>

          <div className="ba-modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Video size={15} aria-hidden />
              {submitting ? 'Creating…' : 'Create Meet & Send Invites'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
