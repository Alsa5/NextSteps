import { motion, AnimatePresence } from 'framer-motion'

export interface FloatingXpItem {
  id: string
  amount: number
  x: number
  y: number
}

interface FloatingXpProps {
  items: FloatingXpItem[]
  onDone: (id: string) => void
}

export function FloatingXp({ items, onDone }: FloatingXpProps) {
  return (
    <div className="tu-pass-through pointer-events-none absolute inset-0 z-25 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: item.y, x: item.x, scale: 0.8 }}
            animate={{ opacity: 0, y: item.y - 80, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            onAnimationComplete={() => onDone(item.id)}
            className="absolute font-space text-lg font-bold text-neon-gold"
            style={{
              left: item.x,
              top: item.y,
              textShadow: '0 0 12px rgba(251, 191, 36, 0.8)',
            }}
          >
            +{item.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
