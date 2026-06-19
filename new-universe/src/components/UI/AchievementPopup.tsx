import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AchievementId } from '../../data/achievements'

export interface AchievementToast {
  id: string
  achievementId: AchievementId
  emoji: string
  title: string
  subtitle: string
}

interface AchievementPopupProps {
  achievements: AchievementToast[]
  onDismiss: (id: string) => void
}

export function AchievementPopup({ achievements, onDismiss }: AchievementPopupProps) {
  return (
    <div className="absolute right-4 top-24 z-30 flex flex-col gap-2 font-space">
      <AnimatePresence>
        {achievements.map((a) => (
          <AchievementCard key={a.id} achievement={a} onDismiss={() => onDismiss(a.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function AchievementCard({
  achievement,
  onDismiss,
}: {
  achievement: AchievementToast
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="glass-panel w-64 rounded-xl px-4 py-3"
      style={{ border: '1px solid rgba(168, 85, 247, 0.3)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{achievement.emoji}</span>
        <div>
          <div className="text-sm font-bold text-white">{achievement.title}</div>
          <div className="text-xs text-white/50">{achievement.subtitle}</div>
        </div>
      </div>
    </motion.div>
  )
}
