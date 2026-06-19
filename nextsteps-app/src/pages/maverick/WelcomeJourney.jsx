import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle, ArrowRight, Sparkles, Star, Zap } from 'lucide-react'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import AppMagicCard from '../../components/AppMagicCard'
import PersonAvatar from '../../components/PersonAvatar'
import mockData from '../../data/mockData.json'

const STEPS = [
  { id: 'welcome', title: 'Welcome to NextSteps', icon: '🚀' },
  { id: 'profile', title: 'Build your Profile', icon: '👤' },
  { id: 'resume', title: 'Upload Resume & Certs', icon: '📄' },
  { id: 'lanyard', title: 'Your Identity Lanyard', icon: '🪪' },
  { id: 'roadmap', title: 'Your Journey Roadmap', icon: '🗺️' },
  { id: 'mission', title: 'First Daily Mission', icon: '🎯' },
]

const PHASES = [
  { ph: 0, name: 'Pre-Onboarding', color: 'var(--brand-amber)' },
  { ph: 1, name: 'Spark: Soft Skills', color: 'var(--brand-violet)' },
  { ph: 2, name: 'Spark: Foundation Tech', color: 'var(--brand-blue)' },
  { ph: 3, name: 'Stream Training', color: '#22c55e' },
  { ph: 4, name: 'Project Internship', color: '#f97316' },
  { ph: 5, name: 'Deployment', color: '#ec4899' },
]

export default function WelcomeJourney() {
  const user = mockData.currentUser
  const [step, setStep] = useState(0)
  const [resumeUploaded, setResumeUploaded] = useState(false)
  const [certUploaded, setCertUploaded] = useState(false)
  const [missionDone, setMissionDone] = useState(false)

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const isLast = step === STEPS.length - 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <MetaversePageHero
        role="maverick"
        title="Welcome Journey"
        subtitle="Your first steps into the Maverick Nebula — let's set you up"
      />

      {/* Step progress bar */}
      <AppMagicCard className="card" style={{ marginBottom: 24, padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, flexShrink: 0,
                background: i < step ? 'var(--brand-violet)' : i === step ? 'var(--brand-amber)' : 'rgba(255,255,255,0.08)',
                color: i <= step ? '#fff' : 'rgba(255,255,255,0.3)',
                border: i === step ? '2px solid var(--brand-amber)' : '2px solid transparent',
                fontWeight: 700, transition: 'all 0.3s',
              }}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 4px',
                  background: i < step ? 'var(--brand-violet)' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'center' }}>
          Step {step + 1} of {STEPS.length} — {STEPS[step].title}
        </p>
      </AppMagicCard>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
        >
          {/* STEP 0: Welcome */}
          {step === 0 && (
            <AppMagicCard className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
              <h2 style={{ marginBottom: 8 }}>Welcome to Hexaware, {user.name.split(' ')[0]}!</h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 24px' }}>
                Your training journey starts here. NextSteps is your mission control — track your progress,
                earn XP, unlock skills, and get deployed as a Hexawarian. Every session, quiz, and feedback
                earns you points toward your next level.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
                {[['🎯', 'Daily Missions'], ['⚡', 'XP & Levels'], ['🏆', 'Batch Leaderboard'], ['🤖', 'AI Learning Buddy']].map(([icon, label]) => (
                  <div key={label} style={{
                    padding: '8px 16px', borderRadius: 20, background: 'rgba(123,92,245,0.15)',
                    border: '1px solid rgba(123,92,245,0.3)', fontSize: 13, color: '#e8e4ff',
                  }}>
                    {icon} {label}
                  </div>
                ))}
              </div>
              <motion.button onClick={next} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-primary">
                Begin My Journey <ArrowRight size={16} />
              </motion.button>
            </AppMagicCard>
          )}

          {/* STEP 1: Profile */}
          {step === 1 && (
            <AppMagicCard className="card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <PersonAvatar userId={user.id} size={72} />
                <div>
                  <h2 style={{ marginBottom: 4 }}>{user.name}</h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>{user.track} Trainee · Batch {user.batch}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{user.email}</p>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12, marginBottom: 24 }}>
                {[['Full Name', user.name], ['Batch', user.batch], ['Track', user.track], ['Email', user.email]].map(([label, value]) => (
                  <div key={label} style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                Your profile is pre-populated by L&D. Review and confirm to continue.
              </p>
              <motion.button onClick={next} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-primary">
                Looks Good — Continue <ArrowRight size={16} />
              </motion.button>
            </AppMagicCard>
          )}

          {/* STEP 2: Resume & Certs */}
          {step === 2 && (
            <AppMagicCard className="card" style={{ padding: 32 }}>
              <h2 style={{ marginBottom: 8 }}>Upload Resume & Certificates</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
                Our AI parses your resume and certifications to build your Skill Profile. This powers the
                AI Batch Segregation, Stream Recommender, and your personalised missions.
                Earn <strong style={{ color: 'var(--brand-amber)' }}>100 XP</strong> on completion.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {/* Resume upload */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12,
                  border: `2px dashed ${resumeUploaded ? 'var(--brand-violet)' : 'rgba(255,255,255,0.15)'}`,
                  background: resumeUploaded ? 'rgba(123,92,245,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                }}>
                  <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={() => setResumeUploaded(true)} />
                  <div style={{ fontSize: 28 }}>{resumeUploaded ? '✅' : '📄'}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Resume (PDF)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      {resumeUploaded ? 'Uploaded — AI parsing in progress' : 'Click to select your resume PDF'}
                    </div>
                  </div>
                  {!resumeUploaded && <Upload size={18} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)' }} />}
                </label>
                {/* Cert upload */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12,
                  border: `2px dashed ${certUploaded ? 'var(--brand-violet)' : 'rgba(255,255,255,0.15)'}`,
                  background: certUploaded ? 'rgba(123,92,245,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                }}>
                  <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={() => setCertUploaded(true)} />
                  <div style={{ fontSize: 28 }}>{certUploaded ? '✅' : '🏅'}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Certificates (optional)</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      {certUploaded ? 'Uploaded — processing certificates' : 'AWS, Coursera, NPTEL, GitHub link…'}
                    </div>
                  </div>
                  {!certUploaded && <Upload size={18} style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.3)' }} />}
                </label>
              </div>
              <motion.button
                onClick={next}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
              >
                {resumeUploaded ? 'Continue' : 'Skip for Now'} <ArrowRight size={16} />
              </motion.button>
            </AppMagicCard>
          )}

          {/* STEP 3: Lanyard */}
          {step === 3 && (
            <AppMagicCard className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🪪</div>
              <h2 style={{ marginBottom: 8 }}>Your Identity Lanyard</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
                This is your digital identity card in NextSteps. It shows your name, batch, track, and
                current level. It evolves as you progress — and when you're deployed, it unlocks the
                <strong style={{ color: 'var(--brand-amber)' }}> Deployed</strong> badge.
              </p>
              <div style={{
                display: 'inline-block', padding: '20px 32px', borderRadius: 16, marginBottom: 24,
                background: 'linear-gradient(135deg, #4361EE22, #7B5CF522)',
                border: '2px solid rgba(123,92,245,0.4)',
              }}>
                <PersonAvatar userId={user.id} size={64} />
                <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{user.track} · Batch {user.batch}</div>
                <div style={{
                  marginTop: 8, display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(123,92,245,0.25)', border: '1px solid rgba(123,92,245,0.5)',
                  fontSize: 11, color: 'var(--brand-violet)',
                }}>
                  <Sparkles size={10} style={{ marginRight: 4 }} />
                  Level {user.level} · {user.levelTitle}
                </div>
              </div>
              <br />
              <motion.button onClick={next} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-primary">
                Love it — Continue <ArrowRight size={16} />
              </motion.button>
            </AppMagicCard>
          )}

          {/* STEP 4: Roadmap */}
          {step === 4 && (
            <AppMagicCard className="card" style={{ padding: 32 }}>
              <h2 style={{ marginBottom: 8 }}>Your Journey Roadmap</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 20 }}>
                Six phases from training to deployment. You're currently in Phase {user.phase}.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {PHASES.map((p) => (
                  <div key={p.ph} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10,
                    background: p.ph === user.phase ? 'rgba(123,92,245,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${p.ph === user.phase ? 'rgba(123,92,245,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: p.ph <= user.phase ? p.color : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                      color: p.ph <= user.phase ? '#fff' : 'rgba(255,255,255,0.3)', flexShrink: 0,
                    }}>
                      {p.ph <= user.phase ? <CheckCircle size={14} /> : p.ph}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: p.ph === user.phase ? 700 : 400, color: p.ph <= user.phase ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                        Phase {p.ph}: {p.name}
                      </span>
                    </div>
                    {p.ph === user.phase && (
                      <span style={{ fontSize: 11, color: p.color, fontWeight: 600 }}>← You are here</span>
                    )}
                  </div>
                ))}
              </div>
              <motion.button onClick={next} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="btn btn-primary">
                Got it — Final Step <ArrowRight size={16} />
              </motion.button>
            </AppMagicCard>
          )}

          {/* STEP 5: First Mission */}
          {step === 5 && (
            <AppMagicCard className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
              <h2 style={{ marginBottom: 8 }}>Your First Daily Mission</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
                Complete this mission to earn XP and start your streak. New missions unlock every day based on your weak areas.
              </p>
              <AppMagicCard style={{
                padding: 20, borderRadius: 14, marginBottom: 24, textAlign: 'left',
                background: 'rgba(123,92,245,0.1)', border: '1px solid rgba(123,92,245,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Zap size={24} style={{ color: 'var(--brand-amber)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Submit Pulse Feedback for Today's Session</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      Just 3 quick questions — 30 seconds max. Earn <strong style={{ color: 'var(--brand-amber)' }}>30 XP</strong>
                    </div>
                  </div>
                </div>
              </AppMagicCard>
              {!missionDone ? (
                <motion.button
                  onClick={() => setMissionDone(true)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn btn-primary"
                  style={{ marginBottom: 12 }}
                >
                  Mark as Done <Star size={16} />
                </motion.button>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                  <p style={{ color: 'var(--brand-amber)', fontWeight: 700, marginBottom: 16 }}>+30 XP earned! Streak started!</p>
                </motion.div>
              )}
              <motion.a
                href="/"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
                style={{ display: 'inline-flex', textDecoration: 'none' }}
              >
                Go to Mission HQ <ArrowRight size={16} />
              </motion.a>
            </AppMagicCard>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
