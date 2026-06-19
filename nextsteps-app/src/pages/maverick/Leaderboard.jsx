import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Star, TrendingUp } from 'lucide-react'
import mockData from '../../data/mockData.json'
import PersonAvatar from '../../components/PersonAvatar'
import AppMagicCard from '../../components/AppMagicCard'

export default function Leaderboard() {
  const lb = mockData.leaderboard

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="page-header">
        <h1>🏆 Batch Leaderboard</h1>
        <p>Batch 13 — Jan 2025 · See where you stand among your peers</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-center justify-center gap-24" style={{ marginBottom: 40, padding: '20px 0' }}>
        {[lb[1], lb[0], lb[2]].map((entry, i) => {
          const isFirst = i === 1
          const rank = entry.rank
          const colors = rank === 1 ? '#FFB347' : rank === 2 ? '#C0C0C0' : '#CD7F32'
          return (
            <motion.div
              key={entry.maverickId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                animate={isFirst ? { y: [0, -8, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: isFirst ? 100 : 80,
                  height: isFirst ? 100 : 80,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${colors}33, ${colors}66)`,
                  border: `3px solid ${colors}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontSize: isFirst ? 36 : 28, fontWeight: 800,
color: colors,
                  boxShadow: `0 8px 30px ${colors}33`
                }}
              >
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </motion.div>
              <div style={{ fontWeight: 700, fontSize: isFirst ? 16 : 14 }}>{entry.name}</div>
              <div style={{ fontWeight: 800, color: 'var(--accent-violet)', fontSize: isFirst ? 20 : 16 }}>
                {entry.xp.toLocaleString()} XP
              </div>
              <div className="flex items-center justify-center gap-8 mt-8">
                <span className="tag tag-violet">Lv {entry.level}</span>
                <span style={{ fontSize: 12 }}><Flame size={12} style={{ color: 'var(--accent-amber)' }} aria-hidden /> {entry.streak}d</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Full Table */}
      <AppMagicCard className="card">
        <div className="card-header">
          <div className="card-title">Full Rankings</div>
          <span className="tag tag-green">{lb.length} Mavericks</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Maverick</th>
              <th>XP</th>
              <th>Level</th>
              <th>Streak</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {lb.map((entry, i) => (
              <motion.tr
                key={entry.maverickId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ background: entry.maverickId === 'mav-001' ? 'var(--secondary-lavender)' : 'transparent' }}
              >
                <td>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-12">
                    <div className="leaderboard-avatar-wrap">
                      <PersonAvatar userId={entry.maverickId} size={40} title={entry.name} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{entry.name}</div>
                      {entry.maverickId === 'mav-001' && <span className="tag tag-violet" style={{ fontSize: 9 }}>You</span>}
                    </div>
                  </div>
                </td>
                <td><span style={{ fontWeight: 800, color: 'var(--accent-violet)' }}>{entry.xp.toLocaleString()}</span></td>
                <td>Level {entry.level}</td>
                <td>
                  <div className="flex items-center gap-4">
                    <Flame size={14} style={{ color: 'var(--accent-amber)' }} aria-hidden />
                    <span style={{ fontWeight: 600 }}>{entry.streak} days</span>
                  </div>
                </td>
                <td>
                  <TrendingUp size={16} style={{ color: 'var(--accent-blue)' }} aria-hidden />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </AppMagicCard>

      {/* Batch XP Challenge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <AppMagicCard
          className="card mt-24"
          style={{
            background:
              'linear-gradient(135deg, rgba(247, 201, 72, 0.22) 0%, rgba(123, 92, 245, 0.18) 55%, rgba(67, 97, 238, 0.15) 100%)',
            textAlign: 'center',
          }}
        >
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
        <h3 style={{ marginBottom: 8 }}>Batch XP Challenge</h3>
        <p style={{ color: 'var(--base-text-secondary)', marginBottom: 16 }}>
          Your batch is <strong>4 submissions</strong> away from 90% feedback completion this week.
          Hit it and <strong style={{ color: 'var(--accent-violet)' }}>everyone gets +200 XP!</strong>
        </p>
        <div className="progress-bar" style={{ maxWidth: 400, margin: '0 auto', height: 12 }}>
          <div className="progress-fill coral" style={{ width: '86%' }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-violet)', marginTop: 8 }}>86% → 90%</div>
        </AppMagicCard>
      </motion.div>
    </motion.div>
  )
}
