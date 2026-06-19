import { motion, AnimatePresence } from 'framer-motion'
import { TRAINING_STAGES } from '../../data/trainingStages'
import { XP_PER_COURSE, STREAK_BONUS_XP } from '../../data/gamification'
import type { TrainingStage } from '../../data/trainingStages'

interface SidePanelProps {
  stage: TrainingStage | null
  planetIndex: number
  isCurrentPlanet: boolean
  isFlying: boolean
  isZoomingOut: boolean
  streakBonusEligible: boolean
  onComplete: () => void
  onClose: () => void
  isAnimating: boolean
}

function GlowingStars({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="text-sm transition-all"
          style={{
            color: i < count ? '#fbbf24' : 'rgba(255,255,255,0.15)',
            textShadow: i < count ? '0 0 8px rgba(251,191,36,0.8)' : 'none',
          }}
        >
          ★
        </span>
      ))}
    </span>
  )
}

export function SidePanel({
  stage,
  planetIndex,
  isCurrentPlanet,
  isFlying,
  isZoomingOut,
  streakBonusEligible,
  onComplete,
  onClose,
  isAnimating,
}: SidePanelProps) {
  const prerequisite = stage && planetIndex > 0 ? TRAINING_STAGES[planetIndex - 1] : null
  const baseXp = XP_PER_COURSE
  const bonusXp = streakBonusEligible ? STREAK_BONUS_XP : 0
  const totalXp = baseXp + bonusXp

  return (
    <AnimatePresence>
      {stage && (
        <motion.aside
          key={stage.id}
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="glass-panel tu-interactive absolute right-4 top-4 z-20 max-h-[calc(100vh-2rem)] w-[min(340px,92vw)] overflow-y-auto rounded-2xl p-6 pr-5 font-space shadow-glow"
          style={{ scrollbarGutter: 'stable' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white/80"
            aria-label="Close panel"
          >
            ✕
          </button>

          <div className="mb-1 text-xs font-medium uppercase tracking-widest text-neon-purple">
            Planet {planetIndex + 1}
          </div>
          <h2 className="neon-text mb-2 text-2xl font-bold text-white">{stage.name}</h2>
          <div
            className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: `${stage.color}22`,
              border: `1px solid ${stage.color}66`,
              color: stage.emissive,
            }}
          >
            {stage.skill}
          </div>

          <p className="mb-4 text-sm leading-relaxed text-white/60">{stage.description}</p>

          {isCurrentPlanet && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-neon-gold/30 bg-neon-gold/5 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Reward</span>
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-lg font-bold text-neon-gold"
                >
                  +{totalXp} XP
                </motion.span>
              </div>
              {bonusXp > 0 && (
                <div className="mt-1 text-xs text-orange-300">Includes +{bonusXp} streak bonus 🔥</div>
              )}
            </motion.div>
          )}

          <div className="mb-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-white/40">
              <span>Estimated time</span>
              <span className="text-white/70">{stage.time}</span>
            </div>
            {prerequisite && (
              <div className="flex items-center justify-between text-white/40">
                <span>Prerequisite</span>
                <span className="flex items-center gap-1.5 text-white/70">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: prerequisite.color, boxShadow: `0 0 4px ${prerequisite.color}` }}
                  />
                  {prerequisite.name}
                </span>
              </div>
            )}
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Difficulty</span>
              <GlowingStars count={stage.difficulty} />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.emissive})` }}
                initial={{ width: '0%' }}
                animate={{ width: isCurrentPlanet ? '60%' : '100%' }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>

          {isCurrentPlanet && (
            <motion.button
              type="button"
              animate={
                !isAnimating
                  ? {
                      boxShadow: [
                        `0 0 20px ${stage.emissive}44`,
                        `0 0 30px ${stage.emissive}66`,
                        `0 0 20px ${stage.emissive}44`,
                      ],
                    }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 2 }}
              whileHover={{ scale: isAnimating ? 1 : 1.02 }}
              whileTap={{ scale: isAnimating ? 1 : 0.98 }}
              onClick={onComplete}
              disabled={isAnimating}
              className="relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-70"
              style={{
                background: `linear-gradient(135deg, ${stage.color}, ${stage.emissive})`,
                border: `1px solid ${stage.emissive}88`,
              }}
            >
              {isZoomingOut ? 'Zooming out...' : isFlying ? 'Launching Rocket... 🚀' : isAnimating ? 'Unlocking...' : 'Complete Stage →'}
            </motion.button>
          )}

          {!isCurrentPlanet && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs text-white/50">
              Stage completed ✓
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
