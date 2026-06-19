import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hyperspeed from './Hyperspeed'
import PersonAvatar from './PersonAvatar'
import { formatDisplayName, formatFirstName, resolveProfilePhotoUrl } from '../utils/userDisplay'
import { hyperspeedEffectColors } from '../theme/brandPalette'
import { getWelcomeCopy, NEBULA_COLORS } from '../theme/maverickNebula'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import './SignInSplash.css'

const Lanyard = lazy(() => import('./lanyard/Lanyard'))

const SPLASH_MS = 3800

/** ID card displayed inside the lanyard during hyperspeed */
function NebulaBadge({ graphPhotoUrl, email, userName, employeeId, roleLabel, roleIcon }) {
  const displayName = formatDisplayName(userName)
  const photoUrl = resolveProfilePhotoUrl({ graphPhotoUrl, email, size: 144 })

  return (
    <div className="nebula-badge">
      <div className="nebula-badge__card">
        <div className="nebula-badge__header">
          <span className="nebula-badge__brand">NextSteps</span>
          <span className="nebula-badge__nebula">Maverick Nebula</span>
        </div>
        <div className="nebula-badge__photo-wrap">
          <PersonAvatar
            userId={employeeId || email || displayName}
            email={email}
            photoUrl={photoUrl}
            size={72}
            className="nebula-badge__photo nebula-badge__photo--avatar"
            title={displayName}
          />
        </div>
        <p className="nebula-badge__name">{displayName}</p>
        <div className="nebula-badge__role">
          <span aria-hidden>{roleIcon}</span>
          <span>{roleLabel}</span>
        </div>
        <div className="nebula-badge__barcode" aria-hidden>
          {Array.from({ length: 22 }, (_, i) => (
            <div
              key={i}
              className="nebula-badge__bar"
              style={{ width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SignInSplash({
  userId = '',
  userName = '',
  email = '',
  employeeId = null,
  graphPhotoUrl = null,
  role = 'maverick',
  theme,
  chapterLine,
  onDone,
}) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const welcome = useMemo(() => getWelcomeCopy(role), [role])
  const resolvedChapter = chapterLine ?? welcome.chapterLine
  const [visible, setVisible] = useState(true)
  const finishedRef = useRef(false)

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setVisible(false)
    onDone?.()
  }, [onDone])

  const effectOptions = useMemo(
    () => ({
      distortion: 'turbulentDistortion',
      colors: hyperspeedEffectColors(theme),
    }),
    [theme],
  )

  useEffect(() => {
    if (prefersReducedMotion) return undefined
    const id = window.setTimeout(finish, SPLASH_MS)
    return () => window.clearTimeout(id)
  }, [finish, prefersReducedMotion])

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') finish() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [finish])

  if (!visible) return null

  const displayName = formatDisplayName(userName)
  const firstNameLabel = formatFirstName(userName)

  return (
    <div
      className={`sign-in-splash${prefersReducedMotion ? ' sign-in-splash--reduced' : ''}`}
      role="dialog"
      aria-live="polite"
      aria-label={`Signing in as ${displayName}`}
      style={{
        '--splash-bg': NEBULA_COLORS.base60,
        '--splash-tint': welcome.splashTint,
      }}
    >
      {!prefersReducedMotion && (
        <div className="sign-in-splash__hyperspeed" aria-hidden="true">
          <Hyperspeed effectOptions={effectOptions} />
        </div>
      )}
      {prefersReducedMotion && (
        <div className="sign-in-splash__static-hero" aria-hidden="true" />
      )}

      {/* Physics lanyard with NebulaBadge as the card content */}
      {!prefersReducedMotion && (
        <div className="sign-in-splash__lanyard-wrap" aria-hidden="true">
          <Suspense fallback={null}>
            <Lanyard
              transparent
              badgeContent={
                <NebulaBadge
                  graphPhotoUrl={graphPhotoUrl}
                  email={email}
                  userName={displayName}
                  employeeId={employeeId}
                  roleLabel={welcome.roleLabel}
                  roleIcon={welcome.roleIcon}
                />
              }
            />
          </Suspense>
        </div>
      )}

      <div className="sign-in-splash__overlay">
        <p className="sign-in-splash__eyebrow">{welcome.dashboardCodename}</p>
        <span className="sign-in-splash__badge" aria-label={`Role: ${welcome.roleLabel}`}>
          {welcome.roleIcon} {welcome.roleLabel}
        </span>
        <p className="sign-in-splash__chapter">{resolvedChapter}</p>
        <h2 className="sign-in-splash__title">
          Welcome{firstNameLabel ? `, ${firstNameLabel}` : ''}
        </h2>
        <p className="sign-in-splash__hint">
          {prefersReducedMotion
            ? 'Reduced motion enabled — enter your workspace when ready.'
            : 'Hold for hyperspeed · Escape to enter now'}
        </p>
        <button type="button" className="btn btn-primary sign-in-splash__skip" onClick={finish}>
          Enter workspace
        </button>
      </div>
    </div>
  )
}
