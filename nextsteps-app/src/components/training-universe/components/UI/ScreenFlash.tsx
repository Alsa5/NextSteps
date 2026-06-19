import { motion, AnimatePresence } from 'framer-motion'

interface ScreenFlashProps {
  color: string | null
  duration?: number
}

export function ScreenFlash({ color, duration = 0.5 }: ScreenFlashProps) {
  return (
    <AnimatePresence>
      {color && (
        <motion.div
          key={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.45, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration }}
          className="tu-pass-through absolute inset-0 z-[35]"
          style={{
            boxShadow: `inset 0 0 120px 40px ${color}, inset 0 0 200px 80px ${color}88`,
          }}
        />
      )}
    </AnimatePresence>
  )
}
