import { useState, useCallback, useRef, useEffect, Component, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import * as THREE from 'three'
import { UniverseScene } from './Scene/UniverseScene'
import { SidePanel } from './UI/SidePanel'
import { Toast } from './UI/Toast'
import { ChestModal } from './UI/ChestModal'
import { Header } from './UI/Header'
import { MissionLog, type MissionEntry } from './UI/MissionLog'
import { LevelUpOverlay } from './UI/LevelUpOverlay'
import { ScreenFlash } from './UI/ScreenFlash'
import { DailyChallengeBadge } from './UI/DailyChallengeBadge'
import { AchievementPopup, type AchievementToast } from './UI/AchievementPopup'
import { FloatingXp, type FloatingXpItem } from './UI/FloatingXp'
import { TRAINING_STAGES } from '../data/trainingStages'
import type { TrainingStage } from '../data/trainingStages'
import {
  XP_PER_COURSE,
  STREAK_WINDOW_MS,
  didLevelUp,
  getRank,
  loadStreak,
  updateStreakOnUnlock,
  type Rank,
} from '../data/gamification'
import { checkNewAchievement, incrementDailyCompletions } from '../data/achievements'
import { loadUniverseProgress, saveUniverseProgress, clearUniverseProgress } from '../data/universeProgress'
import '../training-universe.css'

type Phase = 'idle' | 'zooming-out' | 'flying' | 'unlocking' | 'chest'

class UniverseErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="training-universe" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#fff' }}>
          <div style={{ fontSize: 48 }}>🚀</div>
          <div style={{ fontSize: 20, color: '#f43f5e' }}>Training Universe failed to load</div>
          <div style={{ fontSize: 12, color: '#475569', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message}
          </div>
          <button type="button" onClick={() => window.location.reload()} style={{ background: '#7c3aed', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', cursor: 'pointer' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function UniverseUnlockerInner() {
  const initial = loadUniverseProgress()
  const [unlockedIndices, setUnlockedIndices] = useState<Set<number>>(() => new Set(initial.unlockedIndices))
  const [currentIndex, setCurrentIndex] = useState(initial.currentIndex)
  const [selectedStage, setSelectedStage] = useState<TrainingStage | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [flyTargetIndex, setFlyTargetIndex] = useState<number | null>(null)
  const [unlockProgress, setUnlockProgress] = useState(0)
  const [burstingPlanetIndex, setBurstingPlanetIndex] = useState<number | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [chestVisible, setChestVisible] = useState(false)
  const [chestStage, setChestStage] = useState<TrainingStage | null>(null)
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3 | null>(null)
  const [totalXp, setTotalXp] = useState(initial.totalXp)
  const [streak, setStreak] = useState(() => loadStreak().streak)
  const [xpGainKey, setXpGainKey] = useState(0)
  const [missionLog, setMissionLog] = useState<MissionEntry[]>([])
  const [levelUpVisible, setLevelUpVisible] = useState(false)
  const [levelUpRank, setLevelUpRank] = useState<Rank>('Cadet')
  const [chestLevelUpRank, setChestLevelUpRank] = useState<Rank | null>(null)
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<AchievementToast[]>([])
  const [floatingXp, setFloatingXp] = useState<FloatingXpItem[]>([])
  const [hoveredPlanet, setHoveredPlanet] = useState<{ stage: TrainingStage; index: number } | null>(null)

  const unlockAnimRef = useRef<number | null>(null)
  const parallaxRef = useRef({ x: 0, y: 0 })
  const pendingFlyIndexRef = useRef<number | null>(null)
  const pendingLevelUpRef = useRef<Rank | null>(null)

  const persistProgress = useCallback((indices: Set<number>, index: number, xp: number) => {
    saveUniverseProgress({
      unlockedIndices: [...indices],
      currentIndex: index,
      totalXp: xp,
    })
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      parallaxRef.current.x += e.movementX * 0.003
      parallaxRef.current.y -= e.movementY * 0.003
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const streakBonusEligible = useCallback(() => {
    const { lastUnlock } = loadStreak()
    return !lastUnlock || Date.now() - lastUnlock < STREAK_WINDOW_MS
  }, [])

  const spawnFloatingXp = useCallback((amount: number) => {
    const id = `xp-${Date.now()}`
    const x = window.innerWidth * 0.45 + (Math.random() - 0.5) * 80
    const y = window.innerHeight * 0.42
    setFloatingXp((prev) => [...prev, { id, amount, x, y }])
  }, [])

  const handlePlanetClick = useCallback((stage: TrainingStage, index: number) => {
    setSelectedStage(stage)
    setSelectedIndex(index)
    setZoomTarget(new THREE.Vector3(...stage.position))
  }, [])

  const handlePlanetHover = useCallback((stage: TrainingStage | null, index?: number) => {
    if (stage && index !== undefined) setHoveredPlanet({ stage, index })
    else setHoveredPlanet(null)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedStage(null)
    setSelectedIndex(null)
    setZoomTarget(null)
  }, [])

  const handleComplete = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= TRAINING_STAGES.length || phase !== 'idle') return

    setScreenFlash('rgba(251, 146, 60, 0.5)')
    setTimeout(() => setScreenFlash(null), 350)

    setZoomTarget(null)
    pendingFlyIndexRef.current = nextIndex
    setPhase('zooming-out')
  }, [currentIndex, phase])

  const handleOverviewZoomComplete = useCallback(() => {
    const nextIndex = pendingFlyIndexRef.current
    if (nextIndex === null) return
    pendingFlyIndexRef.current = null
    setSelectedStage(null)
    setSelectedIndex(null)
    setPhase('flying')
    setFlyTargetIndex(nextIndex)
  }, [])

  const handleRocketLand = useCallback(() => {
    if (flyTargetIndex === null) return

    setCurrentIndex(flyTargetIndex)
    setPhase('unlocking')
    setBurstingPlanetIndex(flyTargetIndex)
    setUnlockProgress(0)

    const planetColor = TRAINING_STAGES[flyTargetIndex].emissive
    setScreenFlash(`${planetColor}88`)
    setTimeout(() => setScreenFlash(null), 500)

    const start = performance.now()
    const duration = 1500

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setUnlockProgress(t)

      if (t < 1) {
        unlockAnimRef.current = requestAnimationFrame(animate)
      } else {
        const prevCount = unlockedIndices.size
        const newCount = prevCount + 1
        const stage = TRAINING_STAGES[flyTargetIndex]

        const { streak: newStreak, bonusXp } = updateStreakOnUnlock()
        const dailyCount = incrementDailyCompletions()
        const dailyMultiplier = dailyCount >= 2 ? 2 : 1
        const earnedXp = (XP_PER_COURSE + bonusXp) * dailyMultiplier

        setStreak(newStreak)
        setTotalXp((prev) => {
          const nextXp = prev + earnedXp
          setUnlockedIndices((prevIndices) => {
            const nextIndices = new Set([...prevIndices, flyTargetIndex])
            persistProgress(nextIndices, flyTargetIndex, nextXp)
            return nextIndices
          })
          return nextXp
        })
        setXpGainKey((k) => k + 1)
        spawnFloatingXp(earnedXp)
        setMissionLog((prev) => [
          {
            id: `${stage.id}-${Date.now()}`,
            courseName: stage.name,
            color: stage.color,
            xp: earnedXp,
          },
          ...prev,
        ].slice(0, 10))

        const achievement = checkNewAchievement(newCount)
        if (achievement) {
          setAchievements((prev) => [
            ...prev,
            {
              id: `${achievement.id}-${Date.now()}`,
              achievementId: achievement.id,
              emoji: achievement.emoji,
              title: achievement.title,
              subtitle: achievement.subtitle,
            },
          ])
        }

        if (didLevelUp(prevCount, newCount)) {
          const rank = getRank(newCount)
          pendingLevelUpRef.current = rank
          setLevelUpRank(rank)
          setLevelUpVisible(true)
        }

        const chestDelay = pendingLevelUpRef.current ? 2600 : 2000

        setToastVisible(true)
        setTimeout(() => {
          setToastVisible(false)
          setLevelUpVisible(false)
          setChestStage(stage)
          setChestLevelUpRank(pendingLevelUpRef.current)
          setChestVisible(true)
          setPhase('chest')
        }, chestDelay)
      }
    }

    unlockAnimRef.current = requestAnimationFrame(animate)
  }, [flyTargetIndex, unlockedIndices.size, spawnFloatingXp, persistProgress])

  const handleBurstComplete = useCallback(() => setBurstingPlanetIndex(null), [])

  const handleClaimReward = useCallback(() => {
    setChestVisible(false)
    setChestStage(null)
    setChestLevelUpRank(null)
    pendingLevelUpRef.current = null
    setPhase('idle')
    setFlyTargetIndex(null)
    setUnlockProgress(0)
  }, [])

  const handleReset = useCallback(() => {
    if (unlockAnimRef.current) cancelAnimationFrame(unlockAnimRef.current)
    clearUniverseProgress()
    const fresh = loadUniverseProgress()
    setUnlockedIndices(new Set(fresh.unlockedIndices))
    setCurrentIndex(fresh.currentIndex)
    setSelectedStage(null)
    setSelectedIndex(null)
    setPhase('idle')
    setFlyTargetIndex(null)
    setUnlockProgress(0)
    setBurstingPlanetIndex(null)
    setToastVisible(false)
    setChestVisible(false)
    setChestStage(null)
    setZoomTarget(null)
    setTotalXp(fresh.totalXp)
    setStreak(0)
    setXpGainKey(0)
    setMissionLog([])
    setLevelUpVisible(false)
    setChestLevelUpRank(null)
    pendingLevelUpRef.current = null
    pendingFlyIndexRef.current = null
    setScreenFlash(null)
    setAchievements([])
    setFloatingXp([])
    localStorage.removeItem('nextsteps-universe-streak')
    localStorage.removeItem('nextsteps-universe-daily')
    localStorage.removeItem('nextsteps-universe-daily-dismissed')
    localStorage.removeItem('nextsteps-universe-achievements')
  }, [])

  useEffect(() => () => {
    if (unlockAnimRef.current) cancelAnimationFrame(unlockAnimRef.current)
  }, [])

  const isAnimating = phase !== 'idle' && phase !== 'chest'
  const isFlying = phase === 'flying'
  const isZoomingOut = phase === 'zooming-out'

  return (
    <div className="training-universe">
      <div className="training-universe-canvas-layer">
        <Canvas
          camera={{ position: [0, 4, 18], fov: 50 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.6,
          }}
          frameloop="always"
          dpr={[1, 1.5]}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{ width: '100%', height: '100%' }}
        >
          <UniverseScene
            unlockedIndices={unlockedIndices}
            currentIndex={currentIndex}
            selectedStage={selectedStage}
            isFlying={isFlying}
            overviewZoomActive={isZoomingOut}
            flyTargetIndex={flyTargetIndex}
            unlockProgress={unlockProgress}
            burstingPlanetIndex={burstingPlanetIndex}
            onPlanetClick={handlePlanetClick}
            onRocketLand={handleRocketLand}
            onBurstComplete={handleBurstComplete}
            onOverviewZoomComplete={handleOverviewZoomComplete}
            zoomTarget={zoomTarget}
            parallaxRef={parallaxRef}
            onPlanetHover={handlePlanetHover}
          />
        </Canvas>
      </div>

      <DailyChallengeBadge />

      <Header
        unlockedCount={unlockedIndices.size}
        totalXp={totalXp}
        streak={streak}
        xpGainKey={xpGainKey}
        onReset={handleReset}
      />

      <SidePanel
        stage={selectedStage}
        planetIndex={selectedIndex ?? 0}
        isCurrentPlanet={selectedIndex === currentIndex && currentIndex < TRAINING_STAGES.length - 1}
        isFlying={isFlying}
        isZoomingOut={isZoomingOut}
        streakBonusEligible={streakBonusEligible()}
        onComplete={handleComplete}
        onClose={handleClosePanel}
        isAnimating={isAnimating}
      />

      <MissionLog entries={missionLog} />

      <AchievementPopup
        achievements={chestVisible ? [] : achievements}
        onDismiss={(id) => setAchievements((prev) => prev.filter((a) => a.id !== id))}
      />

      <FloatingXp
        items={floatingXp}
        onDone={(id) => setFloatingXp((prev) => prev.filter((x) => x.id !== id))}
      />

      <Toast message="Course Unlocked!" visible={toastVisible && !chestVisible} />

      <ChestModal
        skillName={chestStage?.skill ?? ''}
        courseName={chestStage?.name ?? ''}
        visible={chestVisible}
        levelUpRank={chestLevelUpRank}
        onClaim={handleClaimReward}
      />

      <LevelUpOverlay visible={levelUpVisible && !chestVisible} rank={levelUpRank} />
      <ScreenFlash color={screenFlash} />

      <p className="tu-hint tu-pass-through" aria-hidden>
        Drag to orbit · Scroll to zoom · Click an unlocked planet to explore
      </p>

      <div
        className="tu-pass-through"
        style={{
          position: 'absolute',
          bottom: 6,
          right: 10,
          color: 'rgba(255,255,255,0.18)',
          fontSize: 9,
          fontFamily: 'var(--font-app)',
          pointerEvents: 'none',
          zIndex: 10,
          letterSpacing: 0.5,
        }}
      >
        Planet textures: solarsystemscope.com (CC BY 4.0)
      </div>

      <AnimatePresence>
        {hoveredPlanet && !chestVisible && (
          <motion.div
            key={hoveredPlanet.stage.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="tu-pass-through"
            style={{
              position: 'fixed',
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(5,5,20,0.9)',
              border: `1px solid ${hoveredPlanet.stage.color}55`,
              borderRadius: 24,
              padding: '7px 20px',
              color: '#e2e8f0',
              fontSize: 12,
              fontFamily: 'var(--font-app)',
              fontWeight: 600,
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
              zIndex: 200,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: hoveredPlanet.stage.color, boxShadow: `0 0 6px ${hoveredPlanet.stage.color}`, flexShrink: 0 }} />
            <span style={{ color: hoveredPlanet.stage.color, fontWeight: 700 }}>{hoveredPlanet.stage.name}</span>
            <span style={{ color: '#64748b' }}>{hoveredPlanet.stage.skill}</span>
            <span style={{ color: '#334155', margin: '0 2px' }}>·</span>
            <span style={{ color: unlockedIndices.has(hoveredPlanet.index) ? '#22d3ee' : '#7c3aed' }}>
              {unlockedIndices.has(hoveredPlanet.index) ? 'Click to explore →' : '🔒 Complete previous stage to unlock'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function UniverseUnlocker() {
  return (
    <UniverseErrorBoundary>
      <UniverseUnlockerInner />
    </UniverseErrorBoundary>
  )
}
