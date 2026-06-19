import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { Rank } from '../../data/gamification'

interface ChestModalProps {
  skillName: string
  courseName: string
  visible: boolean
  levelUpRank: Rank | null
  onClaim: () => void
}

export function ChestModal({
  skillName,
  courseName,
  visible,
  levelUpRank,
  onClaim,
}: ChestModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showBadge, setShowBadge] = useState(false)

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsOpen(true), 600)
      return () => clearTimeout(timer)
    }
    setIsOpen(false)
    setShowBadge(false)
  }, [visible])

  const handleClaim = () => {
    if (levelUpRank) {
      setShowBadge(true)
      setTimeout(onClaim, 1800)
    } else {
      onClaim()
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(5, 5, 16, 0.85)' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative flex flex-col items-center"
          >
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 3, opacity: [0, 1, 0.6] }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="chest-glow pointer-events-none absolute h-64 w-64 rounded-full"
                />
              )}
            </AnimatePresence>

            <div className="relative mb-8">
              <div
                className="relative h-24 w-32 rounded-b-lg"
                style={{
                  background: 'linear-gradient(180deg, #92400e 0%, #78350f 100%)',
                  border: '2px solid #b45309',
                  boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3)',
                }}
              >
                <div
                  className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, #fbbf24, #d97706)',
                    boxShadow: '0 0 12px rgba(251, 191, 36, 0.6)',
                  }}
                />
                <div className="absolute inset-x-0 top-0 h-1 bg-amber-600/50" />
              </div>

              <motion.div
                className="chest-lid absolute -top-8 left-0 h-10 w-32 rounded-t-lg"
                animate={{ rotateX: isOpen ? -120 : 0 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  background: 'linear-gradient(180deg, #b45309 0%, #92400e 100%)',
                  border: '2px solid #d97706',
                  transformStyle: 'preserve-3d',
                  perspective: '200px',
                }}
              >
                <div className="absolute inset-x-4 top-2 h-1 rounded bg-amber-400/30" />
              </motion.div>

              <AnimatePresence>
                {isOpen && !showBadge && (
                  <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.5 }}
                    animate={{ y: -60, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.4, type: 'spring', damping: 12 }}
                    className="absolute left-1/2 -translate-x-1/2 text-center"
                  >
                    <div className="text-3xl">⭐</div>
                    <div
                      className="mt-1 whitespace-nowrap text-lg font-bold"
                      style={{
                        color: '#fbbf24',
                        textShadow: '0 0 20px rgba(251, 191, 36, 0.8)',
                      }}
                    >
                      {skillName}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rank badge drop after claim */}
            <AnimatePresence>
              {showBadge && levelUpRank && (
                <motion.div
                  initial={{ y: -80, opacity: 0, rotate: -15, scale: 0.4 }}
                  animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="badge-shine mb-6 rounded-2xl border-2 px-8 py-4 text-center"
                  style={{
                    borderColor: '#fbbf24',
                    background: 'linear-gradient(135deg, #1a1a3e, #0a0a1a)',
                    boxShadow: '0 0 40px rgba(251,191,36,0.5)',
                  }}
                >
                  <div className="text-xs uppercase tracking-[0.25em] text-neon-gold">New Rank</div>
                  <div
                    className="text-2xl font-bold"
                    style={{
                      background: 'linear-gradient(180deg, #fde047, #b45309)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {levelUpRank}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showBadge && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mb-6 text-center font-space"
                >
                  <h3 className="mb-1 text-xl font-bold text-white">Skill Unlocked!</h3>
                  <p className="text-sm text-white/50">
                    You earned <span className="text-neon-gold">{skillName}</span> from{' '}
                    <span className="text-neon-purple">{courseName}</span>
                  </p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isOpen ? 1 : 0 }}
                  transition={{ delay: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaim}
                  className="rounded-xl px-8 py-3 font-space text-sm font-semibold text-space-950"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    boxShadow: '0 0 30px rgba(251, 191, 36, 0.4)',
                  }}
                >
                  Claim Reward
                </motion.button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
