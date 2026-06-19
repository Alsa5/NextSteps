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
          className="tu-chest-overlay tu-rewards-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tu-chest-title"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="tu-chest-card"
          >
            <div className="tu-chest-stage">
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: [0, 0.7, 0.45] }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="tu-chest-glow"
                    aria-hidden
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isOpen && !showBadge && (
                  <motion.div
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.35, type: 'spring', damping: 14 }}
                    className="tu-chest-star"
                    aria-hidden
                  >
                    ⭐
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="tu-chest-box">
                <motion.div
                  className="tu-chest-lid"
                  animate={{ rotateX: isOpen ? -118 : 0 }}
                  transition={{ duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <div className="tu-chest-lid-trim" />
                </motion.div>

                <div className="tu-chest-body">
                  <div className="tu-chest-lock" />
                  <div className="tu-chest-rim" />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showBadge && levelUpRank && (
                <motion.div
                  initial={{ y: -40, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="tu-chest-rank badge-shine"
                >
                  <div className="tu-chest-rank-label">New Rank</div>
                  <div className="tu-chest-rank-name">{levelUpRank}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showBadge && isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="tu-chest-copy-block"
                >
                  <p id="tu-chest-title" className="tu-chest-title">
                    Skill Unlocked!
                  </p>
                  <p className="tu-chest-subtitle">
                    You earned <span className="tu-chest-highlight-gold">{skillName}</span> from{' '}
                    <span className="tu-chest-highlight-purple">{courseName}</span>
                  </p>
                </motion.div>

                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleClaim}
                  className="tu-chest-claim tu-interactive"
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
