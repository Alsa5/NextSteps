import { useContext } from 'react'
import { motion } from 'framer-motion'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { Download, Shield, Sparkles, Star } from 'lucide-react'
import mockData from '../../data/mockData.json'
import PersonAvatar from '../../components/PersonAvatar'
import { AuthContext } from '../../context/AuthContext'
import { formatDisplayName } from '../../utils/userDisplay'
import { BRAND_HEX } from '../../theme/brandPalette'
import AppMagicCard from '../../components/AppMagicCard'

const skillChipStyle = (value) => {
  if (value >= 70) return { background: 'var(--secondary-lavender)', color: 'var(--accent-violet)' }
  if (value >= 40) return { background: 'var(--secondary-peach)', color: 'var(--accent-amber)' }
  return { background: 'var(--secondary-sky)', color: 'var(--accent-blue)' }
}

export default function MaverickPassport() {
  const { user: authUser } = useContext(AuthContext)
  const profile = mockData.currentUser
  const displayName = formatDisplayName(authUser?.name ?? profile.name)
  const email = authUser?.email ?? profile.email
  const phase = mockData.phases[profile.phase]

  const readinessPath =
    profile.readinessScore >= 80
      ? BRAND_HEX.violet
      : profile.readinessScore >= 60
        ? BRAND_HEX.amber
        : BRAND_HEX.blue

  const badgeSurface = (i) =>
    i % 3 === 0 ? 'var(--secondary-lavender)' : i % 3 === 1 ? 'var(--secondary-sky)' : 'var(--secondary-peach)'

  return (
    <motion.div
      className="passport-lanyard-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="passport-lanyard-stage">
        <header className="passport-lanyard-page__intro">
          <h1 className="passport-lanyard-page__title">Maverick Passport</h1>
          <p className="passport-lanyard-page__subtitle">
            Your badge — tap below or share with your Manager post-deployment.
          </p>
        </header>

        <div className="passport-lanyard-yoke" aria-hidden="true">
          <div className="passport-lanyard-strap passport-lanyard-strap--left" />
          <div className="passport-lanyard-strap passport-lanyard-strap--right" />
          <div className="passport-lanyard-clip">
            <span className="passport-lanyard-clip__slot" />
          </div>
        </div>

        <AppMagicCard className="passport-lanyard-card">
          <div className="passport-lanyard-slot-notch" aria-hidden="true" />

          <div className="passport-lanyard-card__inner">
            <section className="passport-id-hero passport-id-hero--in-badge">
              <div className="passport-id-hero__visual">
                <div className="passport-id-avatar-shell passport-id-avatar-shell--photo">
                  <PersonAvatar
                    userId={authUser?.id ?? profile.id}
                    size={120}
                    title={`Avatar for ${displayName}`}
                    photoUrl={authUser?.graphPhotoUrl}
                    email={email}
                  />
                </div>
                <button
                  type="button"
                  className="passport-id-chat-pill btn btn-secondary"
                  onClick={() => alert('Opens AI Learning Buddy (demo)')}
                >
                  <Star size={16} aria-hidden style={{ color: 'var(--brand-amber)' }} />
                  Let&apos;s talk
                </button>
              </div>

              <div className="passport-id-hero__profile">
                <div className="passport-id-chip-row">
                  <span className="passport-id-chip">
                    <Shield size={14} aria-hidden />
                    Next Steps Passport
                  </span>
                  <span className="passport-id-chip passport-id-chip--muted">Hexaware Mavericks</span>
                </div>
                <h2 className="passport-id-name">{displayName}</h2>
                <p className="passport-id-email">{email}</p>
                <p className="passport-id-meta-id">Maverick ID · {profile.id}</p>

                <div className="passport-id-tags">
                  <span className="tag tag-violet">{profile.track}</span>
                  <span className="tag tag-blue">{profile.batch}</span>
                  <span className="tag tag-amber">{profile.stream || 'Stream TBD'}</span>
                </div>

                <div className="passport-id-mini-stats">
                  <div>
                    <span className="passport-id-mini-stats__label">Streak</span>
                    <span className="passport-id-mini-stats__value">{profile.streak} days</span>
                  </div>
                  <div>
                    <span className="passport-id-mini-stats__label">Joined</span>
                    <span className="passport-id-mini-stats__value">{profile.joinDate}</span>
                  </div>
                  <div>
                    <span className="passport-id-mini-stats__label">Phase</span>
                    <span className="passport-id-mini-stats__value">
                      {profile.phase} · {phase.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="passport-id-stat-strip">
                <div className="passport-id-stat-pill">
                  <span className="passport-id-stat-pill__label">Readiness</span>
                  <div className="passport-id-ring">
                    <CircularProgressbar
                      value={profile.readinessScore}
                      text={`${profile.readinessScore}`}
                      styles={buildStyles({
                        textSize: '18px',
                        textColor: 'var(--base-text)',
                        pathColor: readinessPath,
                        trailColor: 'var(--base-border)',
                      })}
                    />
                  </div>
                </div>
                <div className="passport-id-stat-pill">
                  <span className="passport-id-stat-pill__label">Total XP</span>
                  <span className="passport-id-stat-pill__big">{profile.xp.toLocaleString()}</span>
                </div>
                <div className="passport-id-stat-pill">
                  <span className="passport-id-stat-pill__label">Level</span>
                  <span className="passport-id-stat-pill__big">Lv{profile.level}</span>
                  <span className="passport-id-stat-pill__sub">{profile.levelTitle}</span>
                </div>
                <div className="passport-id-stat-pill passport-id-stat-pill--phase">
                  <span className="passport-id-stat-pill__label">Journey</span>
                  <span className="passport-id-phase-emoji" aria-hidden>
                    {profile.phase === 0 ? '🌱' : profile.phase === 1 ? '✨' : profile.phase === 2 ? '🔧' : profile.phase === 3 ? '🎯' : '🚀'}
                  </span>
                  <span className="passport-id-stat-pill__phase-title">{phase.name}</span>
                  <span className="passport-id-stat-pill__sub">{phase.duration}</span>
                </div>
              </div>
            </section>

            <section className="passport-lanyard-section">
              <div className="passport-id-panel__head">
                <Sparkles size={18} aria-hidden style={{ color: 'var(--accent-violet)' }} />
                <h3>Skills unlocked</h3>
              </div>
              <div className="passport-id-skills">
                {Object.entries(profile.skills).map(([skill, value]) => (
                  <span key={skill} className="passport-id-skill-chip" style={skillChipStyle(value)}>
                    {skill.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} · {value}%
                  </span>
                ))}
              </div>
            </section>

            <section className="passport-lanyard-section">
              <div className="passport-id-panel__head">
                <Shield size={18} aria-hidden style={{ color: 'var(--accent-blue)' }} />
                <h3>Earned badges</h3>
              </div>
              <div className="passport-id-badges">
                {profile.badges.map((badgeId, i) => {
                  const badge = mockData.badges[badgeId]
                  return (
                    <motion.div
                      key={badgeId}
                      className="passport-id-badge-card"
                      style={{ background: badgeSurface(i) }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="passport-id-badge-card__icon">{badge.icon}</div>
                      <div className="passport-id-badge-card__name">{badge.name}</div>
                      <div className="passport-id-badge-card__rarity">{badge.rarity}</div>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            <section className="passport-lanyard-section passport-lanyard-section--export">
              <p className="passport-id-export__copy">
                Export your Passport as a PDF to share with your Manager post-deployment.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => alert('PDF export would be generated here')}
              >
                <Download size={18} aria-hidden /> Export Passport PDF
              </button>
            </section>
          </div>
        </AppMagicCard>
      </div>
    </motion.div>
  )
}
