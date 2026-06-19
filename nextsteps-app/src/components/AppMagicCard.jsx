import { forwardRef } from 'react'
import {
  ParticleCard,
  DEFAULT_GLOW_COLOR,
  DEFAULT_PARTICLE_COUNT,
  useMagicMobile,
} from './magic-bento/MagicBento'

/**
 * Magic Bento shell for app cards (stars, border glow, click ripple).
 * Global spotlight attaches to Layout main (.magic-bento-zone).
 */
export const AppMagicCard = forwardRef(function AppMagicCard(
  {
    className = '',
    style,
    children,
    textAutoHide = false,
    enableStars = true,
    enableBorderGlow = true,
    disableAnimations,
    particleCount = DEFAULT_PARTICLE_COUNT,
    enableTilt = false,
    enableMagnetism = false,
    clickEffect = true,
    glowColor = DEFAULT_GLOW_COLOR,
  },
  ref,
) {
  const isMobile = useMagicMobile()
  const reduced = disableAnimations ?? isMobile

  const borderClass = enableBorderGlow ? 'magic-bento-card--border-glow' : ''
  const autohideClass = textAutoHide ? 'magic-bento-card--text-autohide' : ''

  return (
    <ParticleCard
      ref={ref}
      className={`app-magic-card magic-bento-card ${borderClass} ${autohideClass} ${className}`.trim()}
      style={style}
      disableAnimations={reduced}
      particleCount={particleCount}
      glowColor={glowColor}
      enableStars={enableStars}
      enableTilt={enableTilt}
      clickEffect={clickEffect}
      enableMagnetism={enableMagnetism}
    >
      {children}
    </ParticleCard>
  )
})

export default AppMagicCard
