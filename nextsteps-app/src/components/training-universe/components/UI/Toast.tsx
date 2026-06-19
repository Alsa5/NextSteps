import { motion, AnimatePresence } from 'framer-motion'

interface ToastProps {
  message: string
  visible: boolean
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="tu-pass-through absolute left-1/2 top-6 z-30 -translate-x-1/2"
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-6 py-3 font-space shadow-glow-gold"
            style={{
              background: 'rgba(10, 10, 26, 0.9)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <span className="text-xl">🎉</span>
            <span className="text-sm font-semibold text-neon-gold">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
