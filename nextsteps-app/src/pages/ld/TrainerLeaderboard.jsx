import React, { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'
import TrainerDrawer from '../../components/trainer/TrainerDrawer'
import CertificateTemplate from '../../components/CertificateTemplate'
import MetaversePageHero from '../../components/metaverse/MetaversePageHero'
import { getTierColor, getTierDisplayName } from '../../lib/trainerTierUtils'

export default function TrainerLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTier, setSelectedTier] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sendingCertId, setSendingCertId] = useState(null)
  const [certConfirm, setCertConfirm] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [hoveredActionId, setHoveredActionId] = useState(null)
  const certificateRef = useRef(null)

  // Helper function to get initials: first letter of first name + first letter of last name
  const getInitials = (name) => {
    if (!name || name === 'Unknown') return 'UN'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      // Single name: use first two letters
      return parts[0].substring(0, 2).toUpperCase()
    }
    // Multiple names: first letter of first name + first letter of last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Fetch leaderboard
  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const token = sessionStorage.getItem('nextsteps_token')
      if (!token) throw new Error('No auth token')

      const response = await fetch('/api/v1/trainer-scores/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error(`Failed: ${response.status}`)
      const data = await response.json()
      setLeaderboard(data.trainers || [])
    } catch (error) {
      console.error('[TrainerLeaderboard] Error:', error)
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  // ALWAYS compute podium independently (always by score)
  const podiumTrainers = useMemo(() => {
    const sorted = [...leaderboard].sort((a, b) => (b.scorePercentage || 0) - (a.scorePercentage || 0))
    return sorted.slice(0, 3)
  }, [leaderboard])

  // FIXED: Single useMemo with filter THEN sort (no mutation)
  const displayedTrainers = useMemo(() => {
    let result = [...leaderboard]

    // 1. Tier filter
    if (selectedTier !== 'all') {
      result = result.filter(t => t.tier?.toLowerCase() === selectedTier.toLowerCase())
    }

    // 2. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.trainerName?.toLowerCase().includes(q) ||
        t.trainerEmail?.toLowerCase().includes(q) ||
        t.recentSessionScores?.some(s => s.batchId?.toLowerCase().includes(q))
      )
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'awePoints':
          return (b.awePoints || 0) - (a.awePoints || 0)
        case 'streak':
          return (b.consecutiveHighQualitySessions || 0) - (a.consecutiveHighQualitySessions || 0)
        case 'name':
          return (a.trainerName || '').localeCompare(b.trainerName || '')
        case 'score':
        default:
          return (b.scorePercentage || 0) - (a.scorePercentage || 0)
      }
    })

    return result
  }, [leaderboard, selectedTier, searchQuery, sortBy])

  // Calculate stats from ALL leaderboard data
  const stats = useMemo(() => {
    if (leaderboard.length === 0) return { total: 0, avgScore: 0, totalAwe: 0, maxStreak: 0 }
    const avgScore = (leaderboard.reduce((s, t) => s + (t.scorePercentage || 0), 0) / leaderboard.length).toFixed(1)
    const totalAwe = leaderboard.reduce((s, t) => s + (t.awePoints || 0), 0)
    const maxStreak = Math.max(...leaderboard.map(t => t.consecutiveHighQualitySessions || 0), 0)
    return { total: leaderboard.length, avgScore, totalAwe, maxStreak }
  }, [leaderboard])
  const handleSendCertificate = async (trainer) => {
    setSendingCertId(trainer._id)
    try {
      // Generate certificate image using html2canvas
      let certificateImageBase64 = null;
      try {
        // Create a temporary hidden container for the certificate
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.zIndex = '-1';
        document.body.appendChild(tempContainer);

        // Create certificate component data
        const certData = {
          tier: trainer.tier,
          issuedAt: new Date().toISOString(),
          issuedBy: sessionStorage.getItem('user_email') || 'NextSteps L&D'
        };

        // Render certificate using ReactDOM
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(tempContainer);
        
        await new Promise((resolve) => {
          root.render(
            React.createElement(CertificateTemplate, {
              trainer,
              cert: certData,
              ref: certificateRef
            })
          );
          // Wait for render
          setTimeout(resolve, 500);
        });

        // Capture the certificate as image
        const certElement = tempContainer.querySelector('[data-cert="true"]');
        if (certElement) {
          const canvas = await html2canvas(certElement, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: 900,
            height: 636
          });
          certificateImageBase64 = canvas.toDataURL('image/png').split(',')[1];
        }

        // Cleanup
        root.unmount();
        document.body.removeChild(tempContainer);

      } catch (e) {
        console.warn('Could not generate certificate image:', e);
        certificateImageBase64 = null;
      }

      const token = sessionStorage.getItem('nextsteps_token')
      const res = await fetch('/api/v1/trainer-scores/send-certificate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: trainer._id,
          tier: trainer.tier,
          certificateImageBase64,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.5 } })
      toast.success(`Certificate sent to ${trainer.trainerName || 'Unknown'}! 🎓`)
    } catch (e) {
      console.error('Certificate error:', e)
      toast.error('Failed to send certificate')
    } finally {
      setSendingCertId(null)
    }
  }
  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      color: '#fff',
      overflow: 'visible',
    }} data-page="trainer-leaderboard">
      {/* Scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(123,92,245,0.015) 2px, rgba(123,92,245,0.015) 4px)',
        backgroundSize: '100% 4px',
      }} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <MetaversePageHero
          role="ld"
          title="Trainer Leaderboard"
          subtitle="Unified leaderboard of all trainer performance tiers, batch history, and L&D recognition — issue certifications and awe points directly from here."
        />

        {/* Podium Section */}
        {podiumTrainers.length > 0 && (
          <div style={{
            padding: '60px 40px 40px 40px',
            borderBottom: '1px solid rgba(123,92,245,0.1)',
            marginBottom: 24,
            overflow: 'visible',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 16,
              overflow: 'visible',
            }}>
              {/* #2 Card */}
              {podiumTrainers[1] && (
                <PodiumCard
                  trainer={podiumTrainers[1]}
                  rank={2}
                  height="220px"
                  onRecognize={() => { setSelectedTrainer(podiumTrainers[1]); setShowDrawer(true) }}
                  onCertificate={() => setCertConfirm(podiumTrainers[1])}
                />
              )}

              {/* #1 Card (center, tallest) */}
              {podiumTrainers[0] && (
                <div style={{ paddingBottom: 32 }}>
                  <motion.div
                    style={{ background: 'transparent', borderRadius: 16 }}
                    animate={{ boxShadow: [
                      `0 0 20px ${getTierColor(podiumTrainers[0].tier)}33`,
                      `0 0 45px ${getTierColor(podiumTrainers[0].tier)}66`,
                      `0 0 20px ${getTierColor(podiumTrainers[0].tier)}33`,
                    ]}}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <PodiumCard
                      trainer={podiumTrainers[0]}
                      rank={1}
                      height="260px"
                      onRecognize={() => { setSelectedTrainer(podiumTrainers[0]); setShowDrawer(true) }}
                      onCertificate={() => setCertConfirm(podiumTrainers[0])}
                    />
                  </motion.div>
                </div>
              )}

              {/* #3 Card */}
              {podiumTrainers[2] && (
                <PodiumCard
                  trainer={podiumTrainers[2]}
                  rank={3}
                  height="220px"
                  onRecognize={() => { setSelectedTrainer(podiumTrainers[2]); setShowDrawer(true) }}
                  onCertificate={() => setCertConfirm(podiumTrainers[2])}
                />
              )}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div style={{
          padding: '16px 32px',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          borderBottom: '1px solid rgba(123,92,245,0.1)',
          flexWrap: 'wrap',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(123,92,245,0.25)',
            borderRadius: 8,
            padding: '8px 12px',
            width: 280,
          }}>
            <Search size={16} color="rgba(255,255,255,0.4)" />
            <input
              type="text"
              placeholder="Search trainers, email, batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 13,
                flex: 1,
                outline: 'none',
              }}
            />
          </div>

          {/* Tier Pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'platinum', 'gold', 'silver', 'bronze'].map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                style={{
                  height: 36,
                  padding: '0 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 20,
                  cursor: 'pointer',
                  background: selectedTier === tier ? '#7b5cf5' : 'rgba(123,92,245,0.1)',
                  border: selectedTier === tier ? 'none' : '1px solid rgba(123,92,245,0.3)',
                  color: '#fff',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              height: 36,
              padding: '0 12px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 20,
              cursor: 'pointer',
              background: 'rgba(123,92,245,0.1)',
              border: '1px solid rgba(123,92,245,0.3)',
              color: '#fff',
              outline: 'none',
              appearance: 'auto',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <option value="score" style={{ background: '#0d0a2e' }}>Sort: Score</option>
            <option value="awePoints" style={{ background: '#0d0a2e' }}>Sort: Awe Points</option>
            <option value="streak" style={{ background: '#0d0a2e' }}>Sort: Streak</option>
            <option value="name" style={{ background: '#0d0a2e' }}>Sort: Name</option>
          </select>
        </div>

        {/* Stats Footer Bar */}
        <div style={{
          padding: '12px 32px',
          background: 'rgba(123,92,245,0.05)',
          border: '1px solid rgba(123,92,245,0.1)',
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          gap: 24,
          borderBottom: '1px solid rgba(123,92,245,0.1)',
          flexWrap: 'wrap',
        }}>
          <div>👥 {stats.total} Trainers</div>
          <div>📊 Avg Score: <span style={{ color: '#fff', fontWeight: 700 }}>{stats.avgScore}/100</span></div>
          <div>⭐ Total Awe: <span style={{ color: '#f5c542', fontWeight: 700 }}>{stats.totalAwe}</span></div>
          <div>🔥 Top Streak: <span style={{ color: '#f97316', fontWeight: 700 }}>{stats.maxStreak} sessions</span></div>
        </div>
        {/* Leaderboard Table */}
        {loading ? (
          <div style={{ padding: '60px 32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            Loading trainers...
          </div>
        ) : displayedTrainers.length === 0 ? (
          <div style={{ padding: '60px 32px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            No trainers found
          </div>
        ) : (
          <div style={{ padding: '20px 32px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 140px 100px 120px 80px 100px 200px',
              gap: 12,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(123,92,245,0.1)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              <div>Rank</div>
              <div>Trainer</div>
              <div>Batch</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                PERFORMANCE SCORE
                <span
                  title="Exponentially weighted average across last 5 sessions blending: mood positivity %, average clarity (1-5), average pace (1-5), and response rate. Recent sessions weighted more heavily."
                  style={{ marginLeft: 4, cursor: 'help', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                >
                  ⓘ
                </span>
              </div>
              <div>Tier</div>
              <div>Streak</div>
              <div>Awe Pts</div>
              <div>Actions</div>
            </div>

            <AnimatePresence mode="popLayout">
              {displayedTrainers.map((trainer, idx) => (
                <motion.div
                  key={trainer._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => { setSelectedTrainer(trainer); setShowDrawer(true) }}
                  onMouseEnter={() => setHoveredId(trainer._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 140px 100px 120px 80px 100px 200px',
                    gap: 12,
                    padding: '12px 14px',
                    background: hoveredId === trainer._id ? 'rgba(123,92,245,0.06)' : 'transparent',
                    borderLeft: hoveredId === trainer._id ? '3px solid #7b5cf5' : '3px solid transparent',
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  {/* Rank */}
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                    {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                  </div>

                  {/* Trainer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: getTierColor(trainer.tier),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#000',
                      border: `2px solid ${getTierColor(trainer.tier)}`,
                      boxShadow: `0 0 12px ${getTierColor(trainer.tier)}66`,
                    }}>
                      {getInitials(trainer.trainerName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trainer.trainerName || 'Unknown'}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trainer.trainerEmail}
                      </div>
                    </div>
                  </div>

                  {/* Batch */}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                    {trainer.recentSessionScores?.[0]?.batchId || '—'}
                  </div>

                  {/* Score with bar */}
                  <div>
                    <div style={{
                      color: trainer.scorePercentage > 80 ? '#4ade80' : trainer.scorePercentage > 60 ? '#f5c542' : '#f87171',
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 4,
                    }}>
                      {trainer.scorePercentage.toFixed(1)}
                    </div>
                    <div style={{
                      width: '100%',
                      height: 3,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${trainer.scorePercentage}%`,
                        height: '100%',
                        background: trainer.scorePercentage > 80 ? '#4ade80' : trainer.scorePercentage > 60 ? '#f5c542' : '#f87171',
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>

                  {/* Tier */}
                  <div style={{
                    padding: '4px 8px',
                    background: getTierColor(trainer.tier),
                    borderRadius: 6,
                    color: '#000',
                    fontWeight: 700,
                    fontSize: 10,
                    textAlign: 'center',
                  }}>
                    {getTierDisplayName(trainer.tier)}
                  </div>

                  {/* Streak */}
                  <div style={{ color: trainer.consecutiveHighQualitySessions > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                    {trainer.consecutiveHighQualitySessions > 0 ? `🔥 ${trainer.consecutiveHighQualitySessions}` : '—'}
                  </div>

                  {/* Awe Points */}
                  <div style={{ color: '#f5c542', fontWeight: 700 }}>
                    ⭐ {trainer.awePoints || 0}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setSelectedTrainer(trainer); setShowDrawer(true) }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(123,92,245,0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(123,92,245,0.2)'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 12px',
                        height: 32,
                        background: 'rgba(123,92,245,0.2)',
                        border: '1px solid rgba(123,92,245,0.4)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                      }}
                    >
                      🏅 Recognize
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setCertConfirm(trainer) }}
                      disabled={sendingCertId === trainer._id}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,197,66,0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,197,66,0.15)'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 12px',
                        height: 32,
                        background: sendingCertId === trainer._id ? 'rgba(148,163,184,0.15)' : 'rgba(245,197,66,0.15)',
                        border: `1px solid ${sendingCertId === trainer._id ? 'rgba(148,163,184,0.4)' : 'rgba(245,197,66,0.4)'}`,
                        borderRadius: 8,
                        color: '#f5c542',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: sendingCertId === trainer._id ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                      }}
                    >
                      {sendingCertId === trainer._id ? '⏳ Sending...' : '📜 Cert'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Certificate Confirmation Modal */}
      {certConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setCertConfirm(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #0d0a2e, #140f3a)',
              border: `2px solid ${getTierColor(certConfirm.tier)}`,
              borderRadius: 16,
              padding: 32,
              maxWidth: 420,
              width: '90%',
              boxShadow: `0 0 60px ${getTierColor(certConfirm.tier)}44`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {certConfirm.tier === 'platinum' ? '💎' :
               certConfirm.tier === 'gold' ? '🥇' :
               certConfirm.tier === 'silver' ? '🥈' : '🥉'}
            </div>
            <h2 style={{ margin: '0 0 4px', color: getTierColor(certConfirm.tier), fontSize: 20, fontWeight: 800 }}>
              {certConfirm.trainerName || 'Unknown'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 20px' }}>
              Send this certificate to the trainer?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setCertConfirm(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.4)'}
                onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSendCertificate(certConfirm)
                  setCertConfirm(null)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: `linear-gradient(135deg, ${getTierColor(certConfirm.tier)}44, rgba(123,92,245,0.5))`,
                  border: `1px solid ${getTierColor(certConfirm.tier)}`,
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 12,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                📜 Send Certificate
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Trainer Drawer */}
      <TrainerDrawer
        trainer={selectedTrainer}
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        onAwardSuccess={fetchLeaderboard}
      />
    </div>
  )
}

// Podium Card Component
function PodiumCard({ trainer, rank, height, onRecognize, onCertificate }) {
  const [hoveredPodiumAction, setHoveredPodiumAction] = useState(null)
  
  const getInitials = (name) => {
    if (!name || name === 'Unknown') return 'UN'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  
  const getTierGradient = (tier) => {
    const gradients = {
      platinum: 'linear-gradient(135deg, rgba(229,228,226,0.1), rgba(123,92,245,0.15))',
      gold: 'linear-gradient(135deg, rgba(245,197,66,0.15), rgba(123,92,245,0.1))',
      silver: 'linear-gradient(135deg, rgba(168,178,192,0.1), rgba(123,92,245,0.08))',
      bronze: 'linear-gradient(135deg, rgba(205,127,50,0.1), rgba(123,92,245,0.06))',
    }
    return gradients[tier] || gradients.bronze
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.1 : rank === 2 ? 0.2 : 0.3 }}
      style={{
        position: 'relative',
        background: getTierGradient(trainer.tier),
        border: `1px solid ${getTierColor(trainer.tier)}44`,
        borderRadius: 16,
        padding: '40px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth: 160,
        textAlign: 'center',
        backdropFilter: 'blur(12px)',
        overflow: 'visible',
      }}
    >
      {/* Rank badge — inside at top with proper spacing */}
      <div style={{ fontSize: 28, marginBottom: 12, marginTop: -24 }}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
      </div>

      {/* Avatar Circle */}
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: getTierColor(trainer.tier),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 700,
        color: '#000',
        border: `2px solid ${getTierColor(trainer.tier)}`,
        boxShadow: `0 0 16px ${getTierColor(trainer.tier)}88`,
      }}>
        {getInitials(trainer.trainerName)}
      </div>

      {/* Trainer Name */}
      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
        {trainer.trainerName || 'Unknown'}
      </div>

      {/* Tier Badge */}
      <div style={{
        padding: '3px 8px',
        background: getTierColor(trainer.tier),
        borderRadius: 6,
        color: '#000',
        fontWeight: 700,
        fontSize: 9,
      }}>
        {getTierDisplayName(trainer.tier)}
      </div>

      {/* Score */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: getTierColor(trainer.tier) }}>
          {(trainer.scorePercentage || 0).toFixed(0)}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>/100</div>
      </div>

      {/* Awe Points */}
      <div style={{ fontSize: 11, color: '#f5c542', fontWeight: 700, marginBottom: 8 }}>
        ⭐ {trainer.awePoints || 0}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, width: '100%' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onRecognize() }}
          onMouseEnter={() => setHoveredPodiumAction('recognize')}
          onMouseLeave={() => setHoveredPodiumAction(null)}
          style={{
            flex: 1,
            padding: '6px',
            background: hoveredPodiumAction === 'recognize' ? 'rgba(123,92,245,0.5)' : 'rgba(123,92,245,0.3)',
            border: '1px solid rgba(123,92,245,0.5)',
            borderRadius: 5,
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🏆
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCertificate() }}
          onMouseEnter={() => setHoveredPodiumAction('cert')}
          onMouseLeave={() => setHoveredPodiumAction(null)}
          style={{
            flex: 1,
            padding: '6px',
            background: hoveredPodiumAction === 'cert' ? 'rgba(74,222,128,0.5)' : 'rgba(74,222,128,0.3)',
            border: '1px solid rgba(74,222,128,0.5)',
            borderRadius: 5,
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📜
        </button>
      </div>
    </motion.div>
  )
}