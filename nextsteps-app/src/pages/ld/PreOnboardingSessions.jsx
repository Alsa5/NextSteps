import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, CheckCircle2, ExternalLink, Link2, Unlink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import PreOnboardingMeetModal from '../../components/ld/PreOnboardingMeetModal'
import AppMagicCard from '../../components/AppMagicCard'
import { loadBatches, loadTrainees } from '../../data/ldTraineeStore'
import {
  completeLdSession,
  disconnectGoogleOAuth,
  fetchGoogleOAuthStartUrl,
  fetchGoogleOAuthStatus,
  fetchLdSessions,
} from '../../services/sessionApi'

export default function PreOnboardingSessions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState(null)
  const [googleStatus, setGoogleStatus] = useState({ connected: false, email: null, stubMode: true })
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const batches = loadBatches()
  const trainees = loadTrainees()

  const refreshGoogleStatus = useCallback(async () => {
    try {
      const status = await fetchGoogleOAuthStatus()
      setGoogleStatus(status)
    } catch {
      setGoogleStatus({ connected: false, email: null, stubMode: true })
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const { sessions: data } = await fetchLdSessions()
      setSessions(data.filter((s) => s.sessionType === 'pre-onboarding'))
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    refreshGoogleStatus()
  }, [refresh, refreshGoogleStatus])

  useEffect(() => {
    const google = searchParams.get('google')
    if (!google) return

    if (google === 'connected') {
      toast.success('Google Calendar connected — real Meet links enabled')
      refreshGoogleStatus()
    } else if (google === 'error') {
      const message = searchParams.get('message') ?? 'Connection failed'
      toast.error(`Google connection failed: ${message}`)
    }

    searchParams.delete('google')
    searchParams.delete('message')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams, refreshGoogleStatus])

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true)
    try {
      const { url } = await fetchGoogleOAuthStartUrl()
      window.location.href = url
    } catch (err) {
      toast.error(err.message || 'Could not start Google sign-in')
      setConnectingGoogle(false)
    }
  }

  const handleDisconnectGoogle = async () => {
    try {
      await disconnectGoogleOAuth()
      toast.success('Google Calendar disconnected')
      refreshGoogleStatus()
    } catch (err) {
      toast.error(err.message || 'Disconnect failed')
    }
  }

  const handleComplete = async (sessionId) => {
    setCompletingId(sessionId)
    try {
      const result = await completeLdSession(sessionId)
      toast.success('Transcript ingested — GPT analysis ready')
      if (result.transcript?.aiAnalysis?.model) {
        toast.success(`Analysis by ${result.transcript.aiAnalysis.model}`, { duration: 4000 })
      }
      refresh()
    } catch (err) {
      toast.error(err.message || 'Failed to process session')
    } finally {
      setCompletingId(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <MetaversePageHero
        chapter="L&D · Orientation"
        title="Pre-Onboarding Meets"
        subtitle="Create real Google Meet links via your personal Gmail Calendar — invites go to trainer and trainees by email and in-app notification."
      />

      <AppMagicCard className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Google Calendar</div>
            {googleStatus.connected ? (
              <p style={{ fontSize: 13, color: 'var(--base-text-secondary)', margin: 0 }}>
                Connected as <strong>{googleStatus.email}</strong> — Meet links are created on your calendar.
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--base-text-secondary)', margin: 0 }}>
                Connect your Gmail once to create <strong>real</strong> Meet links (not random stubs).
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {googleStatus.connected ? (
              <button type="button" className="btn btn-secondary" onClick={handleDisconnectGoogle}>
                <Unlink size={14} />
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConnectGoogle}
                disabled={connectingGoogle || googleStatus.stubMode}
              >
                <Link2 size={14} />
                {connectingGoogle ? 'Redirecting…' : 'Connect Google Calendar'}
              </button>
            )}
          </div>
        </div>
      </AppMagicCard>

      <div style={{ marginBottom: 20 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
          disabled={!googleStatus.connected && !googleStatus.stubMode}
        >
          <Video size={16} />
          Schedule new meet
        </button>
        {!googleStatus.connected && !googleStatus.stubMode && (
          <p style={{ fontSize: 12, color: 'var(--brand-amber)', marginTop: 8 }}>
            Connect Google Calendar above before scheduling.
          </p>
        )}
      </div>

      {loading ? (
        <p>Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <AppMagicCard className="card">
          <p>No pre-onboarding sessions yet. Connect Google, then schedule a meet for your batch.</p>
        </AppMagicCard>
      ) : (
        <div className="grid-2">
          {sessions.map((s) => (
            <AppMagicCard key={s.id} className="card">
              <div className="card-title" style={{ marginBottom: 8 }}>{s.title}</div>
              <p style={{ fontSize: 13, color: 'var(--base-text-secondary)', marginBottom: 8 }}>
                Batch {s.batchId} · {new Date(s.scheduledAt).toLocaleString()}
              </p>
              <p style={{ fontSize: 12, marginBottom: 12 }}>
                Trainer: {s.trainerName} · {s.audienceEmails.length} invitees
              </p>
              <a
                href={s.meetLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ marginRight: 8 }}
              >
                <ExternalLink size={14} />
                Open Meet
              </a>
              {s.status !== 'completed' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={completingId === s.id}
                  onClick={() => handleComplete(s.id)}
                >
                  <CheckCircle2 size={14} />
                  {completingId === s.id ? 'Analyzing…' : 'End session & run AI analysis'}
                </button>
              )}
              {s.status === 'completed' && (
                <span style={{ color: 'var(--brand-amber)', fontSize: 13, fontWeight: 600 }}>
                  ✓ Transcript analyzed
                </span>
              )}
            </AppMagicCard>
          ))}
        </div>
      )}

      <PreOnboardingMeetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        batches={batches}
        trainees={trainees}
        onCreated={refresh}
      />
    </motion.div>
  )
}
