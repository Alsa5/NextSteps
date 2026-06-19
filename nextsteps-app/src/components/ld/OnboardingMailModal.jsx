import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Mail, Paperclip, Eye } from 'lucide-react'
import { sendOnboardingMail } from '../../config/api-client'

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]

const defaultRoleForTrack = (track) => {
  const map = {
    GET: 'Associate Software Engineer — GET Track',
    PGET: 'Associate Software Engineer — PGET Track',
    STEP: 'Trainee — STEP Program',
    LEAP: 'Trainee — LEAP Program',
  }
  return map[track] ?? `${track} Trainee`
}

const readFileAsAttachment = (file) =>
  new Promise((resolve, reject) => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      reject(new Error('Attachment must be 5 MB or smaller'))
      return
    }
    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      reject(new Error('Use PDF, Word, PNG, or JPEG attachments'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : ''
      resolve({
        filename: file.name,
        contentType: file.type,
        dataBase64: base64,
      })
    }
    reader.onerror = () => reject(new Error('Could not read attachment'))
    reader.readAsDataURL(file)
  })

const formatPreviewDate = (isoDate) => {
  if (!isoDate) return '—'
  const parsed = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * L&D onboarding mail draft — role, location, date, reporting time, optional attachment.
 */
export default function OnboardingMailModal({ trainee, onClose, onSent }) {
  const [role, setRole] = useState(defaultRoleForTrack(trainee.track))
  const [location, setLocation] = useState('Hexaware Technologies — Chennai Global Delivery Center, Siruseri IT Park')
  const [onboardingDate, setOnboardingDate] = useState(
    trainee.joiningDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  )
  const [reportingTime, setReportingTime] = useState('09:00 AM')
  const [attachment, setAttachment] = useState(null)
  const [attachmentName, setAttachmentName] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const preview = useMemo(
    () => ({
      subject: `Welcome to Hexaware — Onboarding on ${formatPreviewDate(onboardingDate)}`,
      role,
      location,
      date: formatPreviewDate(onboardingDate),
      reportingTime,
      batch: trainee.batch || '—',
      track: trainee.track,
    }),
    [role, location, onboardingDate, reportingTime, trainee],
  )

  const handleAttachmentChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setAttachment(null)
      setAttachmentName('')
      return
    }
    setError('')
    try {
      const payload = await readFileAsAttachment(file)
      setAttachment(payload)
      setAttachmentName(file.name)
    } catch (err) {
      setAttachment(null)
      setAttachmentName('')
      setError(err.message || 'Invalid attachment')
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      const result = await sendOnboardingMail({
        traineeName: trainee.name,
        personalEmail: trainee.personalEmail,
        batch: trainee.batch || 'TBD',
        track: trainee.track,
        role: role.trim(),
        location: location.trim(),
        onboardingDate,
        reportingTime: reportingTime.trim(),
        attachment: attachment || undefined,
      })

      onSent({
        employeeId: result.employeeId,
        hexEmail: result.hexEmail,
        delivered: result.delivered,
        channel: result.channel,
        subject: result.subject,
        onboardingDetails: {
          role: role.trim(),
          location: location.trim(),
          onboardingDate,
          reportingTime: reportingTime.trim(),
          attachmentName: attachmentName || null,
        },
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to send onboarding mail')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="ba-modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="ba-modal ba-modal--wide onboarding-mail-modal"
        role="dialog"
        aria-labelledby="onboarding-mail-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="ba-modal__header">
          <h3 id="onboarding-mail-title">Draft onboarding mail</h3>
          <button type="button" className="ba-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="ba-modal__lead">
          Compose the welcome email for <strong>{trainee.name}</strong>. Details are merged into the
          NextSteps template and sent to <strong>{trainee.personalEmail}</strong>.
        </p>

        <form className="onboarding-mail-form" onSubmit={handleSubmit}>
          <div className="onboarding-mail-form__grid">
            <label className="ba-field">
              <span>Role / designation</span>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="ba-input"
                placeholder="e.g. Associate Software Engineer — GET Track"
                required
              />
            </label>

            <label className="ba-field">
              <span>Onboarding location</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="ba-input"
                placeholder="Campus / office address"
                required
              />
            </label>

            <label className="ba-field">
              <span>Onboarding date</span>
              <input
                type="date"
                value={onboardingDate}
                onChange={(e) => setOnboardingDate(e.target.value)}
                className="ba-input"
                required
              />
            </label>

            <label className="ba-field">
              <span>Reporting time</span>
              <input
                type="text"
                value={reportingTime}
                onChange={(e) => setReportingTime(e.target.value)}
                className="ba-input"
                placeholder="e.g. 09:00 AM"
                required
              />
            </label>

            <label className="ba-field onboarding-mail-form__attachment">
              <span>Attachment (optional)</span>
              <div className="onboarding-mail-attach-row">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleAttachmentChange}
                  className="onboarding-mail-file-input"
                  id="onboarding-attachment"
                  aria-label="Attach offer letter or joining instructions"
                />
                <label htmlFor="onboarding-attachment" className="btn btn-outline onboarding-mail-attach-btn">
                  <Paperclip size={15} aria-hidden />
                  {attachmentName || 'Choose file'}
                </label>
                {attachmentName && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setAttachment(null)
                      setAttachmentName('')
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <small className="onboarding-mail-hint">PDF, Word, PNG, or JPEG — max 5 MB</small>
            </label>
          </div>

          <div className="onboarding-mail-preview-wrap">
            <button
              type="button"
              className="onboarding-mail-preview-toggle"
              onClick={() => setShowPreview((v) => !v)}
            >
              <Eye size={14} aria-hidden />
              {showPreview ? 'Hide template preview' : 'Show template preview'}
            </button>

            {showPreview && (
              <div className="onboarding-mail-preview" aria-live="polite">
                <p className="onboarding-mail-preview__subject">{preview.subject}</p>
                <p>Dear {trainee.name},</p>
                <p>
                  Congratulations! We are delighted to confirm your onboarding as a{' '}
                  <strong>{preview.role}</strong> under batch <strong>{preview.batch}</strong> ({preview.track}).
                </p>
                <ul className="onboarding-mail-preview__list">
                  <li><strong>Date:</strong> {preview.date}</li>
                  <li><strong>Reporting time:</strong> {preview.reportingTime}</li>
                  <li><strong>Location:</strong> {preview.location}</li>
                  {attachmentName && <li><strong>Attachment:</strong> {attachmentName}</li>}
                </ul>
                <p className="onboarding-mail-preview__note">
                  Employee ID and @hexaware.com email are generated automatically when the mail is sent.
                </p>
              </div>
            )}
          </div>

          {error && <p className="onboarding-mail-error" role="alert">{error}</p>}

          <div className="ba-modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              <Mail size={15} aria-hidden />
              {sending ? 'Sending…' : 'Send onboarding mail'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
