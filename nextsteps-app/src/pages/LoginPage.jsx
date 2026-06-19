import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  Mail, Shield, ArrowLeft, Volume2, VolumeX,
  Rocket, Users, BarChart3, Brain, Star, Zap,
  TreePine, Shield as ShieldIcon, GitBranch,
} from 'lucide-react'
import toast from 'react-hot-toast'
import GalaxySimBackground from '../components/metaverse/GalaxySimBackground'
import { createGalaxyAmbient } from '../audio/galaxyAmbient'
import { useAzureAuth } from '../auth/AzureAuthProvider'
import { requestMagicLink, verifyMagicLinkOtp } from '../config/api-client'
import { syncTraineeRegistry } from '../config/trainee-registry-sync'
import { loadTrainees } from '../data/ldTraineeStore'
import '../components/metaverse/metaverse.css'
import './LoginPage.css'

/* ── cinematic intro lines ── */
const INTRO_LINES = [
  { text: 'Welcome to the Nebula.', delay: 0 },
  { text: 'A galaxy built for Mavericks.', delay: 1.2 },
  { text: 'Begin your journey here.', delay: 2.4 },
]

const STATS = [
  { value: '2 000+', label: 'Mavericks trained' },
  { value: '95%', label: 'Readiness score' },
  { value: '48h', label: 'Avg. feedback loop' },
  { value: '12', label: 'Active batches' },
]

const FEATURES = [
  {
    icon: Rocket,
    color: '#7b5cf5',
    title: 'Mission HQ',
    body: 'Mavericks land in a personalised dashboard — passport, skill grove, AI buddy, and daily missions in one orbital view.',
    tags: ['Maverick', 'XP', 'Gamification'],
  },
  {
    icon: TreePine,
    color: '#22c55e',
    title: 'Skill Grove',
    body: 'A living 3-D tree that grows a branch for every achieved milestone. Locked levels hang as buds; completions bloom.',
    tags: ['Maverick', '3-D', 'Achievements'],
  },
  {
    icon: Users,
    color: '#4361ee',
    title: 'Trainer Pulse Deck',
    body: 'Session logging, batch pulse boards, AI transcript analysis, and readiness scoring from a single observatory.',
    tags: ['Trainer', 'AI', 'Analytics'],
  },
  {
    icon: Zap,
    color: '#f7c948',
    title: 'Feedback Engine',
    body: 'Mavericks rate trainers; managers rate Mavericks. In-app notifications close every feedback loop in real time.',
    tags: ['Feedback', 'Notifications', 'All roles'],
  },
  {
    icon: BarChart3,
    color: '#ef7351',
    title: 'L&D Intelligence',
    body: 'Batch lifecycle manager, curriculum copilot, AI batch segregation, and effectiveness loop for programme owners.',
    tags: ['L&D', 'AI', 'Reports'],
  },
  {
    icon: Brain,
    color: '#00e5ff',
    title: 'AI Analysis',
    body: 'Transcript-based session analysis, readiness prediction, and smart stream recommendations powered by AI.',
    tags: ['AI', 'Maverick', 'Trainer'],
  },
  {
    icon: GitBranch,
    color: '#a78bfa',
    title: 'Deployment Horizon',
    body: 'Managers track post-deployment Mavericks, review performance, and raise early-alert flags on the horizon view.',
    tags: ['Manager', 'Reviews', 'Post-deploy'],
  },
  {
    icon: ShieldIcon,
    color: '#fb923c',
    title: 'Onboarding Pipeline',
    body: 'L&D sends onboarding mails to pre-onboarding trainees. One click creates their Hexaware domain account.',
    tags: ['L&D', 'Onboarding', 'Email'],
  },
]

/* ── Cinematic intro overlay ── */
function NebulaCinematicIntro({ onDone }) {
  const [lineIdx, setLineIdx] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timers = INTRO_LINES.map((line, i) =>
      window.setTimeout(() => setLineIdx(i), line.delay * 1000 + 300),
    )
    const exitTimer = window.setTimeout(() => {
      setDone(true)
      window.setTimeout(onDone, 700)
    }, INTRO_LINES[INTRO_LINES.length - 1].delay * 1000 + 2000)

    return () => {
      timers.forEach(window.clearTimeout)
      window.clearTimeout(exitTimer)
    }
  }, [onDone])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="nebula-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="nebula-intro__lines">
            {INTRO_LINES.map((line, i) => (
              <AnimatePresence key={line.text}>
                {i === lineIdx && (
                  <motion.p
                    className={`nebula-intro__line ${i === 2 ? 'nebula-intro__line--cta' : ''}`}
                    initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                    transition={{ duration: 0.65 }}
                  >
                    {line.text}
                  </motion.p>
                )}
              </AnimatePresence>
            ))}
          </div>
          <div className="nebula-intro__skip">
            <button
              type="button"
              className="nebula-intro__skip-btn"
              onClick={() => { setDone(true); window.setTimeout(onDone, 300) }}
            >
              Skip intro
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Personal email form ── */
function PersonalEmailForm({ onBack, onAuthenticated }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otp, setOtp] = useState('')
  const [devLink, setDevLink] = useState(null)
  const [devOtp, setDevOtp] = useState(null)
  const [deliveryMessage, setDeliveryMessage] = useState('')

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const result = await requestMagicLink(email)
      setSent(true)
      setDeliveryMessage(result.message || 'Check your inbox for a magic link and 6-digit code.')
      if (result.devVerifyPath) setDevLink(result.devVerifyPath)
      if (result.devOtp) setDevOtp(result.devOtp)
    } catch (error) {
      toast.error(error.message || 'Unable to send sign-in code')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) return
    setVerifying(true)
    try {
      const { user } = await verifyMagicLinkOtp(email, otp)
      onAuthenticated?.(user)
    } catch (error) {
      toast.error(error.message || 'Invalid or expired code')
    } finally {
      setVerifying(false)
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="login-email-sent">
        <div className="login-email-sent__icon" aria-hidden>📬</div>
        <h3>Sign-in code sent</h3>
        <p>{deliveryMessage}</p>
        <p>
          We sent details to <strong>{email}</strong>. Enter the 6-digit code below, or open the link in your email.
        </p>

        <form className="login-otp-form" onSubmit={handleVerifyOtp}>
          <label className="login-otp-label" htmlFor="login-otp-input">
            6-digit code
          </label>
          <input
            id="login-otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="login-input login-otp-input"
            aria-label="Six digit sign-in code"
          />
          <motion.button
            type="submit"
            disabled={verifying || otp.length !== 6}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn btn-primary login-submit-btn"
          >
            {verifying ? 'Verifying…' : 'Verify & enter'}
          </motion.button>
        </form>

        {devOtp && (
          <p className="login-dev-otp" aria-live="polite">
            Dev code: <strong>{devOtp}</strong>
          </p>
        )}
        {devLink && (
          <a href={devLink} className="login-dev-link">
            Dev: open magic link
          </a>
        )}
        <button type="button" className="login-back-btn" onClick={onBack}>
          <ArrowLeft size={14} aria-hidden /> Back
        </button>
      </motion.div>
    )
  }

  return (
    <motion.form
      onSubmit={handleSend}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ width: '100%' }}
    >
      <p className="login-form-lead">
        Use the personal email you were onboarded with (college Gmail or vendor address).
        Mavericks in training and external trainers are welcome here.
      </p>
      <div className="login-input-wrap">
        <Mail size={16} className="login-input-icon" aria-hidden />
        <input
          type="email"
          placeholder="you@gmail.com or vendor@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
          aria-label="Personal email address"
        />
      </div>
      <motion.button
        type="submit"
        disabled={loading || !email}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="btn btn-primary login-submit-btn"
      >
        {loading ? 'Sending…' : 'Send sign-in code'}
      </motion.button>
      <button type="button" className="login-back-btn" onClick={onBack}>
        <ArrowLeft size={12} aria-hidden /> Back
      </button>
    </motion.form>
  )
}

/* ── Main login page ── */
export default function LoginPage({ onAuthenticated }) {
  const { login } = useAzureAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [authMode, setAuthMode] = useState(null)
  const [ssoLoading, setSsoLoading] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const ambientRef = useRef(null)
  const galaxySimRef = useRef(null)
  const loginInFlightRef = useRef(false)

  useEffect(() => {
    ambientRef.current = createGalaxyAmbient()
    return () => {
      ambientRef.current?.dispose()
      ambientRef.current = null
    }
  }, [])

  /* Dev: push browser roster → API so roster trainees can magic-link sign in */
  useEffect(() => {
    if (!import.meta.env.DEV) return
    syncTraineeRegistry(loadTrainees()).catch(() => {})
  }, [])

  const setGalaxyAudioMuted = useCallback((muted) => {
    galaxySimRef.current?.setAudioMuted(muted)
  }, [])

  const toggleMusic = useCallback(async () => {
    const ambient = ambientRef.current
    if (!ambient) return

    if (ambient.isPlaying()) {
      await ambient.stop()
      setGalaxyAudioMuted(true)
      setMusicOn(false)
      return
    }

    try {
      await ambient.start()
      setGalaxyAudioMuted(true)
      setMusicOn(true)
    } catch {
      setMusicOn(false)
    }
  }, [setGalaxyAudioMuted])

  /* Ensure iframe ambient track stays muted — parent MP3 handles music */
  useEffect(() => {
    setGalaxyAudioMuted(true)
  }, [setGalaxyAudioMuted])

  /* cleanup on unmount */
  useEffect(() => () => {
    ambientRef.current?.stop()
    setGalaxyAudioMuted(true)
  }, [setGalaxyAudioMuted])

  /* ── SSO ── */
  const handleSso = useCallback(async () => {
    if (loginInFlightRef.current) return
    loginInFlightRef.current = true
    setSsoLoading(true)
    try {
      await login()
    } catch (error) {
      setSsoLoading(false)
      loginInFlightRef.current = false
      if (error?.errorCode !== 'interaction_in_progress') {
        toast.error(error?.message || 'Microsoft sign-in failed')
      }
    }
  }, [login])

  const openEmailFlow = useCallback(() => {
    setAuthMode('email')
    setSearchParams({ auth: 'email' }, { replace: true })
  }, [setSearchParams])

  const resetAuthFlow = useCallback(() => {
    setAuthMode(null)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'email') { setAuthMode('email'); return }
    if (auth === 'sso') {
      setSsoLoading(false)
      loginInFlightRef.current = false
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <>
      {/* Full-screen galaxy-sim iframe (pointer-events: none so it doesn't block UI) */}
      <GalaxySimBackground ref={galaxySimRef} />

      {/* Cinematic opening */}
      <NebulaCinematicIntro onDone={() => setIntroDone(true)} />

      <div className="login-landing login-landing--galaxy-bg">
        {/* ── Top bar ── */}
        <header className="login-topbar">
          <div className="login-topbar__brand">
            <span className="login-topbar__logo" aria-hidden>✦</span>
            <span className="login-topbar__name">NextSteps</span>
            <span className="login-topbar__badge">Maverick Nebula</span>
          </div>
          <nav className="login-topbar__nav" aria-label="Landing sections">
            <a href="#about">About</a>
            <a href="#features">Capabilities</a>
            <a href="#sign-in">Sign in</a>
          </nav>
          <div className="login-topbar__actions">
            <button
              type="button"
              className="login-music-toggle"
              onClick={toggleMusic}
              aria-label={musicOn ? 'Mute galaxy music' : 'Play galaxy music'}
              aria-pressed={musicOn}
            >
              {musicOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="login-music-label">{musicOn ? 'Mute' : '♪ Music'}</span>
            </button>
          </div>
        </header>

        {/* ── Hero + Sign-in (two-column row) ── */}
        <AnimatePresence>
          {introDone && (
            <motion.section
              className="login-main-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7 }}
              id="about"
            >
              {/* Left — hero copy */}
              <div className="login-hero">
                <div className="login-hero__content">
                  <p className="login-hero__eyebrow">✦ The Maverick Nebula ✦</p>
                  <h1 className="login-hero__title">
                    Your training journey,<br />mapped across the stars.
                  </h1>
                  <p className="login-hero__subtitle">
                    Where every Maverick leaves a luminous trail.
                  </p>
                  <p className="login-hero__body">
                    NextSteps is Hexaware's mission-grade training platform — connecting
                    Mavericks, Trainers, L&amp;D leaders, and Managers from Day 0 through
                    deployment. Sign in once; your portal opens automatically.
                  </p>

                  <div className="login-stats-bar">
                    {STATS.map(({ value, label }) => (
                      <div key={label} className="login-stat">
                        <span className="login-stat__value">{value}</span>
                        <span className="login-stat__label">{label}</span>
                      </div>
                    ))}
                  </div>

                  <a href="#features" className="btn btn-ghost login-hero__cta">
                    Explore capabilities ↓
                  </a>
                </div>
              </div>

              {/* Right — sign-in card */}
              <div className="login-signin-section" id="sign-in">
                <motion.div
                  className="login-card-nebula"
                  initial={{ opacity: 0, y: 32, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <div className="login-card-nebula__header">
                    <div className="login-card-nebula__icon" aria-hidden>✦</div>
                    <h2>Enter the Nebula</h2>
                    <p>Your role is detected automatically — no selection needed.</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {!authMode ? (
                      <motion.div
                        key="auth-choose"
                        className="login-card-nebula__body"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="login-auth-options">
                          <button
                            type="button"
                            className="login-auth-option login-auth-option--sso"
                            disabled={ssoLoading}
                            onClick={handleSso}
                          >
                            <Shield size={22} aria-hidden />
                            <div>
                              <div className="login-auth-option__title">
                                {ssoLoading ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft SSO'}
                              </div>
                              <div className="login-auth-option__sub">
                                Hexaware employees · Mavericks · L&amp;D · Managers
                              </div>
                            </div>
                            <Star size={15} className="login-auth-star" aria-hidden />
                          </button>

                          <button
                            type="button"
                            className="login-auth-option login-auth-option--email"
                            onClick={openEmailFlow}
                          >
                            <Mail size={22} aria-hidden />
                            <div>
                              <div className="login-auth-option__title">Use your personal email</div>
                              <div className="login-auth-option__sub">
                                Onboarded Mavericks (training) · External Trainers
                              </div>
                            </div>
                          </button>
                        </div>
                        <p className="login-card-footnote">
                          NextSteps never stores passwords · auth fully delegated
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="email-form"
                        className="login-card-nebula__body"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PersonalEmailForm onBack={resetAuthFlow} onAuthenticated={onAuthenticated} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Feature cards ── */}
        {introDone && (
          <section className="login-features" id="features">
            <div className="login-features__header">
              <p className="login-features__eyebrow">Platform capabilities</p>
              <h2>Built for every orbit in the programme</h2>
              <p className="login-features__lead">
                Eight interconnected modules span the full Maverick lifecycle —
                from pre-onboarding through deployment and beyond.
              </p>
            </div>
            <div className="login-features__grid">
              {FEATURES.map(({ icon: Icon, color, title, body, tags }) => (
                <article key={title} className="login-feature-card">
                  <div className="login-feature-card__icon" style={{ color }}>
                    <Icon size={24} aria-hidden />
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <div className="login-feature-card__tags">
                    {tags.map((t) => (
                      <span key={t} className="login-feature-tag" style={{ borderColor: `${color}55`, color }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <footer className="login-footer">
          <p>Maverick Nebula · NextSteps Experience Platform · Hexaware Technologies</p>
        </footer>
      </div>
    </>
  )
}
