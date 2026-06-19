import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { isDailyChallengeDismissed, dismissDailyChallenge, loadDailyCompletions } from '../../data/achievements'

export function DailyChallengeBadge() {
  const [visible, setVisible] = useState(false)
  const [completions, setCompletions] = useState(0)

  useEffect(() => {
    setVisible(!isDailyChallengeDismissed())
    setCompletions(loadDailyCompletions())
  }, [])

  const handleDismiss = () => {
    dismissDailyChallenge()
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="tu-interactive absolute left-1/2 top-4 z-30 -translate-x-1/2 font-space"
        >
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="glass-panel relative flex items-center gap-3 rounded-full px-5 py-2.5 pr-10"
            style={{ border: '1px solid rgba(251, 191, 36, 0.35)' }}
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-lg"
            >
              ⚡
            </motion.span>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-neon-gold">Daily Challenge</div>
              <div className="text-[11px] text-white/50">
                Complete 2 stages today for 2× XP · {completions}/2 done
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
