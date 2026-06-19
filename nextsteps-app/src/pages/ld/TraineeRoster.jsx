import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mail, ChevronRight, X, Download, CheckCircle2, Clock, UserPlus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import PersonAvatar from '../../components/PersonAvatar'
import AddTraineeModal from '../../components/ld/AddTraineeModal'
import OnboardingMailModal from '../../components/ld/OnboardingMailModal'
import { getUnassignedTrainees, loadTrainees, saveTrainees } from '../../data/ldTraineeStore'
import { syncTraineeRegistry } from '../../config/trainee-registry-sync'

/* ── Excel export helper ── */
const exportToCSV = (rows, filename) => {
  const headers = ['ID','Name','Personal Email','Hex Email','Employee ID','Status','Batch','Track','College','Phase','Score']
  const csv = [headers.join(','), ...rows.map((r) =>
    [r.id, r.name, r.personalEmail, r.hexEmail || '', r.employeeId || '', r.status, r.batch, r.track, r.college, r.phase, r.readinessScore].join(','),
  )].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Detail side panel ── */
function TraineeSidePanel({ trainee, onClose, onOpenMailDraft }) {
  const mailSent = trainee.onboardingMailSent
  const isPreOnboarding = trainee.status === 'pre-onboarding' || trainee.status === 'recruited'

  return (
    <motion.aside
      className="trainee-panel"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      <div className="trainee-panel__header">
        <h3>Trainee Profile</h3>
        <button type="button" className="trainee-panel__close" onClick={onClose} aria-label="Close panel">
          <X size={18} />
        </button>
      </div>

      <div className="trainee-panel__avatar-row">
        <PersonAvatar userId={trainee.id} size={64} title={trainee.name} />
        <div>
          <p className="trainee-panel__name">{trainee.name}</p>
          <span className={`trainee-panel__badge trainee-panel__badge--${trainee.status}`}>
            {trainee.status === 'recruited' ? '📋 Recruited' : trainee.status === 'pre-onboarding' ? '⏳ Pre-Onboarding' : '✅ Post-Onboarding'}
          </span>
        </div>
      </div>

      <dl className="trainee-panel__dl">
        <dt>Personal Email</dt>
        <dd>{trainee.personalEmail}</dd>
        {trainee.hexEmail && <><dt>Hex Email</dt><dd>{trainee.hexEmail}</dd></>}
        {trainee.employeeId && <><dt>Employee ID</dt><dd>{trainee.employeeId}</dd></>}
        <dt>Batch</dt>
        <dd>{trainee.batch || '— Unassigned —'}</dd>
        <dt>Track</dt>
        <dd>{trainee.track}</dd>
        {trainee.stream && <><dt>Stream</dt><dd>{trainee.stream}</dd></>}
        <dt>College</dt>
        <dd>{trainee.college}</dd>
        <dt>Phase</dt>
        <dd>{trainee.phase === 0 ? 'Pre-joining' : `Phase ${trainee.phase}`}</dd>
        {trainee.readinessScore > 0 && <><dt>Readiness</dt><dd>{trainee.readinessScore}%</dd></>}
        {trainee.onboardingDetails && (
          <>
            <dt>Onboarding role</dt>
            <dd>{trainee.onboardingDetails.role}</dd>
            <dt>Joining</dt>
            <dd>{trainee.onboardingDetails.onboardingDate} · {trainee.onboardingDetails.reportingTime}</dd>
            <dt>Location</dt>
            <dd>{trainee.onboardingDetails.location}</dd>
          </>
        )}
      </dl>

      {isPreOnboarding && (
        <div className="trainee-panel__actions">
          <p className="trainee-panel__action-hint">
            Draft the onboarding welcome mail with role, location, date, reporting time, and an optional attachment.
            Employee ID and Hexaware email are generated when the mail is sent.
          </p>
          {mailSent ? (
            <div className="trainee-panel__mail-sent">
              <CheckCircle2 size={15} />
              Onboarding mail sent
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary trainee-panel__send-btn"
              onClick={() => onOpenMailDraft(trainee)}
            >
              <Mail size={15} />
              Draft &amp; send onboarding mail
            </button>
          )}
        </div>
      )}
    </motion.aside>
  )
}

/* ── Main page ── */
export default function TraineeRoster() {
  const [trainees, setTrainees] = useState(() => loadTrainees())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [mailDraftTrainee, setMailDraftTrainee] = useState(null)

  const selectedTrainee = selected
    ? trainees.find((t) => t.id === selected.id) ?? selected
    : null

  useEffect(() => {
    saveTrainees(trainees)
    syncTraineeRegistry(trainees).catch(() => {})
  }, [trainees])

  const unassignedCount = getUnassignedTrainees(trainees).length

  const filtered = trainees.filter((t) => {
    const matchStatus = filter === 'all'
      || t.status === filter
      || (filter === 'pre-onboarding' && (t.status === 'pre-onboarding' || t.status === 'recruited'))
      || (filter === 'unassigned' && !t.batch)
    const q = search.toLowerCase()
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.personalEmail.toLowerCase().includes(q) || (t.batch || '').includes(q)
    return matchStatus && matchSearch
  })

  const handleOnboardingMailSent = useCallback((traineeId, result) => {
    setTrainees((prev) =>
      prev.map((t) =>
        t.id === traineeId
          ? {
              ...t,
              onboardingMailSent: true,
              employeeId: result.employeeId,
              hexEmail: result.hexEmail,
              status: 'post-onboarding',
              onboardingDetails: result.onboardingDetails,
              joiningDate: result.onboardingDetails?.onboardingDate ?? t.joiningDate,
            }
          : t,
      ),
    )

    const deliveryNote = result.delivered
      ? 'Email delivered via SMTP.'
      : 'SMTP unavailable — credentials logged on API server (dev mode).'

    toast.success(
      `Onboarding mail sent.\nEmployee ID: ${result.employeeId}\nHex Email: ${result.hexEmail}\n${deliveryNote}`,
      { duration: 7000 },
    )
    setMailDraftTrainee(null)
  }, [])

  const handleTraineeAdded = useCallback((result, error) => {
    if (error) {
      toast.error(error.message || 'Could not add trainee')
      return
    }
    setTrainees(result.trainees)
    toast.success(
      result.trainee.batch
        ? `${result.trainee.name} added to ${result.trainee.batch}`
        : `${result.trainee.name} added to recruitment queue`,
    )
    setShowAddModal(false)
  }, [])

  const preCount = trainees.filter((t) => t.status === 'pre-onboarding' || t.status === 'recruited').length
  const postCount = trainees.filter((t) => t.status === 'post-onboarding').length

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="trainee-roster-page">
      <MetaversePageHero
        role="ld"
        title="Trainee Roster"
        subtitle="All trainees — recruited, pre-onboarding, and post-onboarding — in one constellation view."
      />

      {unassignedCount > 0 && (
        <div className="trainee-roster-banner">
          <span>{unassignedCount} recruited student{unassignedCount !== 1 ? 's' : ''} still need a batch assignment.</span>
          <Link to="/recruitment-queue" className="btn btn-outline btn-sm">Open Recruitment Queue</Link>
        </div>
      )}

      {/* Stats row */}
      <div className="trainee-roster-stats">
        <button type="button" className={`trainee-stat-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          <UserPlus size={14} /> All ({trainees.length})
        </button>
        <button type="button" className={`trainee-stat-chip trainee-stat-chip--pre ${filter === 'pre-onboarding' ? 'active' : ''}`} onClick={() => setFilter('pre-onboarding')}>
          <Clock size={14} /> Pre-Onboarding ({preCount})
        </button>
        <button type="button" className={`trainee-stat-chip ${filter === 'unassigned' ? 'active' : ''}`} onClick={() => setFilter('unassigned')}>
          <UserPlus size={14} /> Unassigned ({unassignedCount})
        </button>
        <button type="button" className={`trainee-stat-chip trainee-stat-chip--post ${filter === 'post-onboarding' ? 'active' : ''}`} onClick={() => setFilter('post-onboarding')}>
          <CheckCircle2 size={14} /> Post-Onboarding ({postCount})
        </button>
      </div>

      {/* Toolbar */}
      <div className="trainee-roster-toolbar">
        <div className="trainee-search">
          <Search size={15} className="trainee-search__icon" />
          <input
            type="search"
            placeholder="Search by name, email, batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="trainee-search__input"
            aria-label="Search trainees"
          />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={15} aria-hidden /> Add trainee
        </button>
        <button
          type="button"
          className="btn btn-ghost trainee-export-btn"
          onClick={() => exportToCSV(filtered, 'trainee-roster.csv')}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Table + side panel */}
      <div className="trainee-roster-layout">
        <div className={`trainee-roster-table-wrap${selected ? ' trainee-roster-table-wrap--split' : ''}`}>
          <table className="trainee-table">
            <thead>
              <tr>
                <th>Trainee</th>
                <th>Batch</th>
                <th>Track</th>
                <th>Status</th>
                <th>Phase</th>
                <th>Score</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className={`trainee-row${selected?.id === t.id ? ' trainee-row--active' : ''}`}
                  onClick={() => setSelected(t)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(t)}
                  role="button"
                  aria-label={`View ${t.name} profile`}
                >
                  <td>
                    <div className="trainee-cell-name">
                      <PersonAvatar userId={t.id} size={32} title={t.name} />
                      <div>
                        <div className="trainee-name">{t.name}</div>
                        <div className="trainee-email">{t.personalEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.batch || <span className="ba-unassigned-pill">Unassigned</span>}</td>
                  <td>{t.track}</td>
                  <td>
                    <span className={`trainee-status-pill trainee-status-pill--${t.status}`}>
                      {t.status === 'recruited' ? '📋 Recruited' : t.status === 'pre-onboarding' ? '⏳ Pre' : '✅ Post'}
                    </span>
                  </td>
                  <td>{t.phase === 0 ? '—' : `Phase ${t.phase}`}</td>
                  <td>
                    {t.readinessScore > 0 ? (
                      <div className="trainee-score-bar">
                        <div
                          className="trainee-score-fill"
                          style={{
                            width: `${t.readinessScore}%`,
                            background: t.readinessScore >= 75 ? '#22c55e' : t.readinessScore >= 55 ? '#f7c948' : '#ef7351',
                          }}
                        />
                        <span>{t.readinessScore}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td><ChevronRight size={16} className="trainee-chevron" /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="trainee-empty">No trainees match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AnimatePresence>
          {selectedTrainee && (
            <TraineeSidePanel
              key={selectedTrainee.id}
              trainee={selectedTrainee}
              onClose={() => setSelected(null)}
              onOpenMailDraft={setMailDraftTrainee}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {mailDraftTrainee && (
          <OnboardingMailModal
            trainee={mailDraftTrainee}
            onClose={() => setMailDraftTrainee(null)}
            onSent={(result) => handleOnboardingMailSent(mailDraftTrainee.id, result)}
          />
        )}
        {showAddModal && (
          <AddTraineeModal
            onClose={() => setShowAddModal(false)}
            onAdded={handleTraineeAdded}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
