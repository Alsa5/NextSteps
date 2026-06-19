import React, { useContext, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Zap, Flame, Target, Trophy, Star, ChevronRight, Sparkles, BookCheck, UserCheck } from 'lucide-react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import mockData from '../../data/mockData.json'
import AppMagicCard from '../../components/AppMagicCard'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import { formatDisplayName, formatFirstName } from '../../utils/userDisplay'
import { AuthContext } from '../../context/AuthContext'
import { loadProgress, toggleMissionComplete, XP_LEVELS } from '../../data/maverickProgress'
import { getAssessmentsForBatch } from '../../data/assessmentStore'

const firstName = (name) => formatFirstName(name)

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function MaverickDashboard() {
  const { user: authUser } = useContext(AuthContext)
  const user = mockData.currentUser
  const welcomeName = firstName(authUser?.name ?? user.name)
  const [progress, setProgress] = useState(() => loadProgress())
  const pendingAssessments = getAssessmentsForBatch(user.batch).filter((q) => !q.completedAt)

  useEffect(() => {
    const refresh = () => setProgress(loadProgress())
    window.addEventListener('maverick-xp-updated', refresh)
    return () => window.removeEventListener('maverick-xp-updated', refresh)
  }, [])

  const xpForNextLevel = XP_LEVELS
  const currentLevelXP = xpForNextLevel[progress.level - 1] || 0
  const nextLevelXP = xpForNextLevel[progress.level] || 12000
  const xpProgress = ((progress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

  const handleToggleMission = (id) => {
    toggleMissionComplete(id)
    setProgress(loadProgress())
  }

  const upcomingSession = mockData.sessions.find(s => s.status === 'upcoming')

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <MetaversePageHero
          role="maverick"
          title={`Welcome, ${welcomeName} 🚀`}
          subtitle="XP, badges, and your Training Universe — unlock planets as you progress"
        />
      </motion.div>
      <motion.div variants={item} className="flex items-center justify-end gap-16" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-8">
          <Flame size={20} style={{ color: 'var(--accent-amber)' }} aria-hidden />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{user.streak}</span>
          <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>day streak</span>
        </div>
      </motion.div>

      {/* XP Bar */}
      <motion.div variants={item}>
        <AppMagicCard className="card card-accent-soft" style={{ marginBottom: 24 }}>
        <div className="flex items-center gap-24">
          <div style={{ width: 80, height: 80 }}>
            <CircularProgressbar
              value={xpProgress}
              text={`Lv${progress.level}`}
              styles={buildStyles({
                textSize: '28px',
                textColor: 'var(--base-text)',
                pathColor: 'var(--brand-violet)',
                trailColor: 'var(--base-border)',
              })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <span style={{ fontSize: 20, fontWeight: 800 }}>{progress.xp.toLocaleString()} XP</span>
                <span className="tag tag-violet" style={{ marginLeft: 12 }}>{progress.levelTitle}</span>
              </div>
              <span className="text-sm text-secondary">{nextLevelXP.toLocaleString()} XP to Level {progress.level + 1}</span>
            </div>
            <div className="xp-bar">
              <motion.div
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
        </AppMagicCard>
      </motion.div>
      <motion.div variants={item} className="grid-4" style={{ marginBottom: 24 }}>
        <AppMagicCard className="stat-card">
          <div className="stat-icon violet"><Target size={22} /></div>
          <div>
            <div className="stat-value">{user.readinessScore}</div>
            <div className="stat-label">Readiness Score</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon emerald"><Star size={22} /></div>
          <div>
            <div className="stat-value">{user.badges.length}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon coral"><Flame size={22} /></div>
          <div>
            <div className="stat-value">{user.streak}</div>
            <div className="stat-label">Day Streak</div>
          </div>
        </AppMagicCard>
        <AppMagicCard className="stat-card">
          <div className="stat-icon amber"><Trophy size={22} /></div>
          <div>
            <div className="stat-value">#3</div>
            <div className="stat-label">Batch Rank</div>
          </div>
        </AppMagicCard>
      </motion.div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Daily Missions */}
        <motion.div variants={item}>
          <AppMagicCard className="card">
            <div className="card-header">
            <div>
              <div className="card-title">🎯 Daily Missions</div>
              <div className="card-subtitle">Complete missions to earn bonus XP</div>
            </div>
            <span className="tag tag-violet">
              {progress.missions.filter(m => m.completed).length}/{progress.missions.length}
            </span>
          </div>
          <div className="flex flex-col gap-12">
            {progress.missions.map(mission => (
              <motion.div
                key={mission.id}
                onClick={() => handleToggleMission(mission.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: mission.completed ? 'var(--secondary-mint)' : 'var(--base-surface)',
                  border: `1.5px solid ${mission.completed ? 'var(--accent-emerald)' : 'transparent'}`,
                  transition: 'var(--transition-base)'
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: `2px solid ${mission.completed ? 'var(--accent-emerald)' : 'var(--base-border)'}`,
                  background: mission.completed ? 'var(--accent-emerald)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 14, flexShrink: 0
                }}>
                  {mission.completed && '✓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, textDecoration: mission.completed ? 'line-through' : 'none', opacity: mission.completed ? 0.6 : 1 }}>
                    {mission.title}
                  </div>
                </div>
                <span className="tag tag-amber">+{mission.xp} XP</span>
              </motion.div>
            ))}
          </div>
          </AppMagicCard>
        </motion.div>
        <motion.div variants={item} className="flex flex-col gap-20">
          {upcomingSession && (
            <AppMagicCard className="card card-accent-session">
              <div className="card-title" style={{ marginBottom: 12 }}>📅 Next Session</div>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>{upcomingSession.title}</h3>
              <p className="text-sm text-secondary" style={{ marginBottom: 4 }}>{upcomingSession.topic}</p>
              <div className="flex items-center gap-16 mt-16">
                <span className="tag tag-blue">{upcomingSession.date}</span>
                <span className="tag tag-violet">{upcomingSession.time}</span>
                <span className="tag tag-green">{upcomingSession.duration}</span>
              </div>
            </AppMagicCard>
          )}

          {pendingAssessments.length > 0 && (
            <AppMagicCard className="card card-accent-session">
              <div className="card-title" style={{ marginBottom: 12 }}>📝 Pending Assessments</div>
              <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>
                {pendingAssessments.length} quiz{pendingAssessments.length !== 1 ? 'zes' : ''} from your trainer
              </p>
              <Link to="/assessments" className="btn btn-primary btn-sm">Take assessments</Link>
            </AppMagicCard>
          )}

          <AppMagicCard className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
            <div className="flex flex-col gap-8">
              {[
                { to: '/pulse-feedback', icon: <Zap size={16} />, label: 'Submit Pulse Feedback', color: 'var(--accent-coral)' },
                { to: '/peer-feedback', icon: <UserCheck size={16} />, label: 'Peer Feedback', color: 'var(--accent-emerald)' },
                { to: '/assessments', icon: <BookCheck size={16} />, label: 'Assessments & Quizzes', color: 'var(--accent-coral)' },
                { to: '/skill-tree', icon: <Sparkles size={16} />, label: 'Training Universe', color: 'var(--accent-violet)' },
                { to: '/ai-buddy', icon: '🤖', label: 'Ask AI Buddy', color: 'var(--accent-blue)' },
                { to: '/leaderboard', icon: <Trophy size={16} />, label: 'Check Leaderboard', color: 'var(--accent-amber)' },
              ].map(action => (
                <Link key={action.to} to={action.to} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 'var(--radius-md)', background: 'var(--base-surface)',
                  transition: 'var(--transition-base)', fontSize: 14, fontWeight: 500
                }}>
                  <span style={{ color: action.color }}>{action.icon}</span>
                  <span style={{ flex: 1 }}>{action.label}</span>
                  <ChevronRight size={16} color="var(--base-text-secondary)" />
                </Link>
              ))}
            </div>
          </AppMagicCard>
        </motion.div>
      </div>

      {/* Batch Leaderboard Snapshot */}
      <motion.div variants={item}>
        <AppMagicCard className="card">
          <div className="card-header">
          <div className="card-title">🏆 Batch Leaderboard — {mockData.batches[0].name}</div>
          <Link to="/leaderboard" className="btn btn-sm btn-secondary">View Full</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Maverick</th>
              <th>XP</th>
              <th>Level</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {mockData.leaderboard.slice(0, 5).map(entry => (
              <tr key={entry.rank} style={{ background: entry.maverickId === 'mav-001' ? 'var(--secondary-lavender)' : 'transparent' }}>
                <td>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{entry.name} {entry.maverickId === 'mav-001' && <span className="tag tag-violet" style={{ marginLeft: 8 }}>You</span>}</td>
                <td><span style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>{entry.xp.toLocaleString()}</span></td>
                <td>Lv {entry.level}</td>
                <td><Flame size={14} style={{ color: 'var(--accent-amber)', verticalAlign: 'middle' }} aria-hidden /> {entry.streak}d</td>
              </tr>
            ))}
          </tbody>
        </table>
        </AppMagicCard>
      </motion.div>
      <motion.div variants={item}>
        <AppMagicCard className="card mt-24">
          <div className="card-header">
          <div className="card-title">🎖️ My Badges</div>
        </div>
        <div className="flex gap-16" style={{ flexWrap: 'wrap' }}>
          {Object.values(mockData.badges).map(badge => {
            const earned = user.badges.includes(badge.id)
            return (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.05 }}
                style={{
                  width: 100, padding: '16px 8px', borderRadius: 'var(--radius-lg)',
                  background: earned ? 'var(--secondary-lavender)' : 'var(--base-surface)',
                  border: `1.5px solid ${earned ? 'var(--accent-violet)' : 'transparent'}`,
                  textAlign: 'center', opacity: earned ? 1 : 0.4,
                  transition: 'var(--transition-base)'
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 6 }}>{badge.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{badge.name}</div>
                <div style={{ fontSize: 9, color: 'var(--base-text-secondary)', marginTop: 2 }}>{badge.rarity}</div>
              </motion.div>
            )
          })}
        </div>
        </AppMagicCard>
      </motion.div>
    </motion.div>
  )
}
