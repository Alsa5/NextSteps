import { motion, AnimatePresence } from 'framer-motion'

export interface MissionEntry {
  id: string
  courseName: string
  color: string
  xp: number
}

interface MissionLogProps {
  entries: MissionEntry[]
}

export function MissionLog({ entries }: MissionLogProps) {
  const visible = entries.slice(0, 3)

  return (
    <div className="absolute bottom-4 left-4 z-20 w-64 font-space">
      <div className="glass-panel rounded-xl px-4 py-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
          Mission Log
        </div>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {visible.length === 0 ? (
              <p className="text-xs text-white/30">No missions completed yet</p>
            ) : (
              visible.map((entry) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                  className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
                  />
                  <span className="flex-1 truncate text-xs text-white/70">{entry.courseName}</span>
                  <span className="text-xs font-semibold text-neon-gold">+{entry.xp} XP</span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
