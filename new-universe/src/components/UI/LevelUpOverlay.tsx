import { motion, AnimatePresence } from 'framer-motion'
import type { Rank } from '../../data/gamification'

interface LevelUpOverlayProps {
  visible: boolean
  rank: Rank
}

export function LevelUpOverlay({ visible, rank }: LevelUpOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-white"
          />
          <motion.div
            initial={{ y: -120, opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.15 }}
            className="relative flex flex-col items-center"
          >
            <div
              className="badge-shine relative rounded-2xl border-2 px-10 py-6 text-center"
              style={{
                borderColor: '#fbbf24',
                background: 'linear-gradient(135deg, #1a1a3e 0%, #0a0a1a 100%)',
                boxShadow: '0 0 60px rgba(251, 191, 36, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <div className="mb-1 text-xs uppercase tracking-[0.3em] text-neon-gold">Rank Up</div>
              <div
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(180deg, #fde047, #f59e0b, #b45309)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.6))',
                }}
              >
                {rank}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
