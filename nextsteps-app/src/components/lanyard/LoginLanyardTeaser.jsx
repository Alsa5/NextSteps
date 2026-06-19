import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { NEBULA_STORY } from '../../theme/maverickNebula'

const Lanyard = lazy(() => import('./Lanyard'))

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(media.matches)
    handleChange()
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

const StaticLanyardFallback = () => (
  <div className="login-lanyard-static" aria-hidden="true">
    <div className="login-lanyard-static__strap" />
    <div className="login-lanyard-static__card">
      <span className="login-lanyard-static__brand">NextSteps</span>
      <span className="login-lanyard-static__role">Maverick Nebula</span>
    </div>
  </div>
)

export default function LoginLanyardTeaser() {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <motion.div
      className="login-lanyard-teaser"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >
      <div className="login-lanyard-teaser__copy">
        <p className="metaverse-story-line">{NEBULA_STORY.title}</p>
        <p className="login-lanyard-teaser__chapter">{NEBULA_STORY.chapters.login}</p>
        <p className="login-lanyard-teaser__hint">
          Sign in once with Microsoft. Your role is resolved from your designation or email and you
          are routed to the right dashboard.
        </p>
      </div>

      {prefersReducedMotion ? (
        <StaticLanyardFallback />
      ) : (
        <Suspense fallback={<StaticLanyardFallback />}>
          <Lanyard transparent />
        </Suspense>
      )}
    </motion.div>
  )
}
