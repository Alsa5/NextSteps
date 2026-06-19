import { motion } from 'framer-motion'
import { TRAINING_STAGES } from '../../data/trainingStages'
import { getRank, getXpProgress } from '../../data/gamification'

interface HeaderProps {
  unlockedCount: number
  totalXp: number
  streak: number
  xpGainKey: number
  onReset: () => void
}

function ProgressRing({ percent, rank }: { percent: number; rank: string }) {
  const radius = 36
  const stroke = 5
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="rgba(255,255,255,0.08)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          key={percent}
          stroke="url(#ringGradient)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-[10px] font-bold uppercase leading-tight text-neon-gold">{rank}</div>
        <div className="text-[9px] text-white/40">{Math.round(percent)}%</div>
      </div>
    </div>
  )
}

export function Header({ unlockedCount, totalXp, streak, xpGainKey, onReset }: HeaderProps) {
  const rank = getRank(unlockedCount)
  const xpProgress = getXpProgress(unlockedCount)
  const percent = (xpProgress.current / xpProgress.max) * 100

  return (
    <header className="tu-interactive absolute left-4 top-4 z-20 font-space">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="header-breathing glass-panel rounded-2xl px-5 py-4"
      >
          <div className="flex items-start gap-4">
            <ProgressRing percent={percent} rank={rank} />

            <div className="min-w-0 flex-1">
              <h1 className="neon-text text-lg font-bold text-white">Training Universe</h1>
              <p className="mt-0.5 text-xs text-white/40">Each planet is a journey stage · unlock as you progress</p>

              <div className="mt-2 text-xs">
                <span className="text-white/40">XP </span>
                <motion.span
                  key={xpGainKey}
                  initial={{ scale: 1.4, color: '#fbbf24' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.4 }}
                  className="font-semibold"
                >
                  {totalXp.toLocaleString()}
                </motion.span>
                <span className="text-white/30"> · {xpProgress.current}/{xpProgress.max} to rank up</span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2 py-1 text-xs">
                  <span>🔥</span>
                  <span className="font-semibold text-orange-300">{streak}</span>
                  <span className="text-white/40">day</span>
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-xs text-white/40">
                    <span>Planets</span>
                    <span>{unlockedCount}/{TRAINING_STAGES.length}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-neon-purple to-neon-blue"
                      animate={{ width: `${(unlockedCount / TRAINING_STAGES.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
                <button
                  onClick={onReset}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/40 transition-colors hover:border-neon-purple/40 hover:text-white/70"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
      </motion.div>
    </header>
  )
}

export type { Rank } from '../../data/gamification'
