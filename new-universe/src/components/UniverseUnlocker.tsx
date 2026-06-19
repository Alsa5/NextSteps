'use client'

import { useState, useCallback, useRef, useEffect, Component, ReactNode } from 'react'
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
import { COURSES } from '../data/courses'
import type { Course } from '../data/courses'
import {
  XP_PER_COURSE,
  STREAK_WINDOW_MS,
  didLevelUp,
  getRank,
  loadStreak,
  updateStreakOnUnlock,
  type Rank,
} from '../data/gamification'
import {
  checkNewAchievement,
  incrementDailyCompletions,
} from '../data/achievements'

type Phase = 'idle' | 'flying' | 'unlocking' | 'chest'

class UniverseErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100vw', 
          height: '100vh',
          background: '#020410',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff', 
          fontFamily: 'sans-serif', 
          gap: 16
        }}>
          <div style={{ fontSize: 48 }}>🚀</div>
          <div style={{ fontSize: 20, color: '#f43f5e' }}>Universe failed to load</div>
          <div style={{
            fontSize: 12, 
            color: '#475569',
            maxWidth: 400, 
            textAlign: 'center'
          }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#7c3aed', 
              border: 'none',
              borderRadius: 8, 
              padding: '10px 24px',
              color: '#fff', 
              cursor: 'pointer', 
              fontSize: 14
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function UniverseUnlockerInner() {
  const [unlockedIndices, setUnlockedIndices] = useState<Set<number>>(() => new Set([0]))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [flyTargetIndex, setFlyTargetIndex] = useState<number | null>(null)
  const [unlockProgress, setUnlockProgress] = useState(0)
  const [burstingPlanetIndex, setBurstingPlanetIndex] = useState<number | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [chestVisible, setChestVisible] = useState(false)
  const [chestCourse, setChestCourse] = useState<Course | null>(null)
  const [zoomTarget, setZoomTarget] = useState<THREE.Vector3 | null>(null)
  const [totalXp, setTotalXp] = useState(0)
  const [streak, setStreak] = useState(() => loadStreak().streak)
  const [xpGainKey, setXpGainKey] = useState(0)
  const [missionLog, setMissionLog] = useState<MissionEntry[]>([])
  const [levelUpVisible, setLevelUpVisible] = useState(false)
  const [levelUpRank, setLevelUpRank] = useState<Rank>('Cadet')
  const [chestLevelUpRank, setChestLevelUpRank] = useState<Rank | null>(null)
  const [screenFlash, setScreenFlash] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<AchievementToast[]>([])
  const [floatingXp, setFloatingXp] = useState<FloatingXpItem[]>([])
  const [hoveredPlanet, setHoveredPlanet] = useState<Course | null>(null)

  const unlockAnimRef = useRef<number | null>(null)
  const parallaxRef = useRef({ x: 0, y: 0 })
  const pendingLevelUpRef = useRef<Rank | null>(null)

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

  const handlePlanetClick = useCallback((course: Course, index: number) => {
    setSelectedCourse(course)
    setSelectedIndex(index)
    setZoomTarget(new THREE.Vector3(...course.position))
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedCourse(null)
    setSelectedIndex(null)
    setZoomTarget(null)
  }, [])

  const handleComplete = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= COURSES.length || phase !== 'idle') return

    setScreenFlash('rgba(251, 146, 60, 0.7)')
    setTimeout(() => setScreenFlash(null), 400)

    setPhase('flying')
    setFlyTargetIndex(nextIndex)
    handleClosePanel()
  }, [currentIndex, phase, handleClosePanel])

  const handleRocketLand = useCallback(() => {
    if (flyTargetIndex === null) return

    setCurrentIndex(flyTargetIndex)
    setPhase('unlocking')
    setBurstingPlanetIndex(flyTargetIndex)
    setUnlockProgress(0)

    const planetColor = COURSES[flyTargetIndex].emissive
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
        const course = COURSES[flyTargetIndex]

        const { streak: newStreak, bonusXp } = updateStreakOnUnlock()
        const dailyCount = incrementDailyCompletions()
        const dailyMultiplier = dailyCount >= 2 ? 2 : 1
        const earnedXp = (XP_PER_COURSE + bonusXp) * dailyMultiplier

        setStreak(newStreak)
        setTotalXp((prev) => prev + earnedXp)
        setXpGainKey((k) => k + 1)
        spawnFloatingXp(earnedXp)

        setMissionLog((prev) => [
          {
            id: `${course.id}-${Date.now()}`,
            courseName: course.name,
            color: course.color,
            xp: earnedXp,
          },
          ...prev,
        ].slice(0, 10))

        setUnlockedIndices((prev) => new Set([...prev, flyTargetIndex]))

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
          setTimeout(() => setLevelUpVisible(false), 2500)
        }

        setToastVisible(true)
        setTimeout(() => {
          setToastVisible(false)
          setChestCourse(course)
          setChestLevelUpRank(pendingLevelUpRef.current)
          setChestVisible(true)
          setPhase('chest')
        }, 2000)
      }
    }

    unlockAnimRef.current = requestAnimationFrame(animate)
  }, [flyTargetIndex, unlockedIndices.size, spawnFloatingXp])

  const handleBurstComplete = useCallback(() => {
    setBurstingPlanetIndex(null)
  }, [])

  const handleClaimReward = useCallback(() => {
    setChestVisible(false)
    setChestCourse(null)
    setChestLevelUpRank(null)
    pendingLevelUpRef.current = null
    setPhase('idle')
    setFlyTargetIndex(null)
    setUnlockProgress(0)
  }, [])

  const handleReset = useCallback(() => {
    if (unlockAnimRef.current) cancelAnimationFrame(unlockAnimRef.current)
    setUnlockedIndices(new Set([0]))
    setCurrentIndex(0)
    setSelectedCourse(null)
    setSelectedIndex(null)
    setPhase('idle')
    setFlyTargetIndex(null)
    setUnlockProgress(0)
    setBurstingPlanetIndex(null)
    setToastVisible(false)
    setChestVisible(false)
    setChestCourse(null)
    setZoomTarget(null)
    setTotalXp(0)
    setStreak(0)
    setXpGainKey(0)
    setMissionLog([])
    setLevelUpVisible(false)
    setChestLevelUpRank(null)
    pendingLevelUpRef.current = null
    setScreenFlash(null)
    setAchievements([])
    setFloatingXp([])
    localStorage.removeItem('universe-streak')
    localStorage.removeItem('universe-daily')
    localStorage.removeItem('universe-daily-dismissed')
    localStorage.removeItem('universe-achievements')
  }, [])

  useEffect(() => {
    return () => {
      if (unlockAnimRef.current) cancelAnimationFrame(unlockAnimRef.current)
    }
  }, [])

  const isAnimating = phase !== 'idle' && phase !== 'chest'
  const isFlying = phase === 'flying'

  return (
    <div 
      className="relative" 
      style={{ 
        width: '100vw', 
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        background: '#020410'
      }}
    >
      <Canvas
        camera={{ position: [0, 4, 18], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: false, 
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.6
        }}
        frameloop="always"
        dpr={[1, 1.5]}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{ width: '100%', height: '100%' }}
      >
        <UniverseScene
          unlockedIndices={unlockedIndices}
          currentIndex={currentIndex}
          selectedCourse={selectedCourse}
          isFlying={isFlying}
          flyTargetIndex={flyTargetIndex}
          unlockProgress={unlockProgress}
          burstingPlanetIndex={burstingPlanetIndex}
          onPlanetClick={handlePlanetClick}
          onRocketLand={handleRocketLand}
          onBurstComplete={handleBurstComplete}
          zoomTarget={zoomTarget}
          parallaxRef={parallaxRef}
          onPlanetHover={setHoveredPlanet}
        />
      </Canvas>

      <DailyChallengeBadge />

      <Header
        unlockedCount={unlockedIndices.size}
        totalXp={totalXp}
        streak={streak}
        xpGainKey={xpGainKey}
        onReset={handleReset}
      />

      <SidePanel
        course={selectedCourse}
        planetIndex={selectedIndex ?? 0}
        isCurrentPlanet={selectedIndex === currentIndex && currentIndex < COURSES.length - 1}
        isFlying={isFlying}
        streakBonusEligible={streakBonusEligible()}
        onComplete={handleComplete}
        onClose={handleClosePanel}
        isAnimating={isAnimating}
      />

      <MissionLog entries={missionLog} />

      <AchievementPopup
        achievements={achievements}
        onDismiss={(id) => setAchievements((prev) => prev.filter((a) => a.id !== id))}
      />

      <FloatingXp
        items={floatingXp}
        onDone={(id) => setFloatingXp((prev) => prev.filter((x) => x.id !== id))}
      />

      <Toast message="Course Unlocked!" visible={toastVisible} />

      <ChestModal
        skillName={chestCourse?.skill ?? ''}
        courseName={chestCourse?.name ?? ''}
        visible={chestVisible}
        levelUpRank={chestLevelUpRank}
        onClaim={handleClaimReward}
      />

      <LevelUpOverlay visible={levelUpVisible} rank={levelUpRank} />

      <ScreenFlash color={screenFlash} />

      <AnimatePresence>
        {hoveredPlanet && (
          <motion.div
            key={hoveredPlanet.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(5,5,20,0.9)',
              border: `1px solid ${hoveredPlanet.color}55`,
              borderRadius: 24,
              padding: '7px 20px',
              color: '#e2e8f0',
              fontSize: 12,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
              zIndex: 200,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: hoveredPlanet.color,
                boxShadow: `0 0 6px ${hoveredPlanet.color}`,
                flexShrink: 0,
              }}
            />
            <span style={{ color: hoveredPlanet.color, fontWeight: 700 }}>{hoveredPlanet.name}</span>
            <span style={{ color: '#64748b' }}>{hoveredPlanet.skill}</span>
            <span style={{ color: '#334155', margin: '0 2px' }}>·</span>
            <span style={{ color: unlockedIndices.has(hoveredPlanet.id) ? '#22d3ee' : '#7c3aed' }}>
              {unlockedIndices.has(hoveredPlanet.id) ? 'Click to explore →' : '🔒 Complete previous to unlock'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          position: 'fixed',
          bottom: 6,
          right: 10,
          color: 'rgba(255,255,255,0.18)',
          fontSize: 9,
          fontFamily: 'Space Grotesk, sans-serif',
          pointerEvents: 'none',
          zIndex: 10,
          letterSpacing: 0.5,
        }}
      >
        Planet textures: solarsystemscope.com (CC BY 4.0)
      </div>
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
