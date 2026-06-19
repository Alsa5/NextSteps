import { useRef, useMemo, useCallback, useEffect, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Starfield } from './Starfield'
import { Nebula } from './Nebula'
import { Planet } from './Planet'
import { CurrentPlanetIndicator } from './CurrentPlanetIndicator'
import { Rocket } from './Rocket'
import { ParticleBurst } from './ParticleBurst'
import { TRAINING_STAGES } from '../../data/trainingStages'
import type { TrainingStage } from '../../data/trainingStages'

const OVERVIEW_CAMERA_OFFSET = new THREE.Vector3(0, 8, 28)

interface UniverseSceneProps {
  unlockedIndices: Set<number>
  currentIndex: number
  selectedStage: TrainingStage | null
  isFlying: boolean
  overviewZoomActive: boolean
  flyTargetIndex: number | null
  unlockProgress: number
  burstingPlanetIndex: number | null
  onPlanetClick: (stage: TrainingStage, index: number) => void
  onRocketLand: () => void
  onBurstComplete: () => void
  onOverviewZoomComplete: () => void
  zoomTarget: THREE.Vector3 | null
  parallaxRef: MutableRefObject<{ x: number; y: number }>
  onPlanetHover: (stage: TrainingStage | null, index?: number) => void
}

export function UniverseScene({
  unlockedIndices,
  currentIndex,
  selectedStage,
  isFlying,
  overviewZoomActive,
  flyTargetIndex,
  unlockProgress,
  burstingPlanetIndex,
  onPlanetClick,
  onRocketLand,
  onBurstComplete,
  onOverviewZoomComplete,
  zoomTarget,
  parallaxRef,
  onPlanetHover,
}: UniverseSceneProps) {
  const controlsRef = useRef<any>(null)
  const landingPadRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()

  const userOverride = useRef(false)
  const planetZoomProgress = useRef(0)
  const planetZoomComplete = useRef(false)
  const planetZoomFrom = useRef(new THREE.Vector3())
  const planetZoomTo = useRef(new THREE.Vector3())
  const planetZoomLookAt = useRef(new THREE.Vector3())

  const overviewProgress = useRef(0)
  const overviewFromPos = useRef(new THREE.Vector3())
  const overviewFromTarget = useRef(new THREE.Vector3())
  const overviewCompleteFired = useRef(false)

  useEffect(() => {
    const canvas = gl.domElement
    const preventDblClick = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
    }
    canvas.addEventListener('dblclick', preventDblClick, true)
    return () => canvas.removeEventListener('dblclick', preventDblClick, true)
  }, [gl])

  const centroid = useMemo(() => {
    const c = TRAINING_STAGES.reduce(
      (acc, stage) => ({
        x: acc.x + stage.position[0] / TRAINING_STAGES.length,
        y: acc.y + stage.position[1] / TRAINING_STAGES.length,
        z: acc.z + stage.position[2] / TRAINING_STAGES.length,
      }),
      { x: 0, y: 0, z: 0 },
    )
    return new THREE.Vector3(c.x, c.y, c.z)
  }, [])

  const overviewCameraPos = useMemo(
    () => centroid.clone().add(OVERVIEW_CAMERA_OFFSET),
    [centroid],
  )

  useEffect(() => {
    if (!overviewZoomActive) return
    userOverride.current = false
    overviewProgress.current = 0
    overviewCompleteFired.current = false
    overviewFromPos.current.copy(camera.position)
    overviewFromTarget.current.copy(controlsRef.current?.target ?? centroid)
    planetZoomComplete.current = true
  }, [overviewZoomActive, camera, centroid])

  useEffect(() => {
    planetZoomProgress.current = 0
    planetZoomComplete.current = false
    if (!zoomTarget) return
    planetZoomFrom.current.copy(camera.position)
    planetZoomLookAt.current.copy(zoomTarget)
    planetZoomTo.current.copy(zoomTarget).add(new THREE.Vector3(3, 2, 5))
  }, [zoomTarget, camera])

  const rocketPosition = useMemo(
    () => new THREE.Vector3(...TRAINING_STAGES[currentIndex].position),
    [currentIndex],
  )

  const rocketTarget = useMemo(() => {
    if (!isFlying || flyTargetIndex === null) return null
    return new THREE.Vector3(...TRAINING_STAGES[flyTargetIndex].position)
  }, [isFlying, flyTargetIndex])

  const trailColor = useMemo(() => {
    if (flyTargetIndex !== null) return TRAINING_STAGES[flyTargetIndex].emissive
    return TRAINING_STAGES[currentIndex].emissive
  }, [flyTargetIndex, currentIndex])

  const dustPositions = useMemo(() => {
    const positions = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return positions
  }, [])

  const finishOverviewZoom = useCallback(() => {
    if (overviewCompleteFired.current) return
    overviewCompleteFired.current = true
    onOverviewZoomComplete()
  }, [onOverviewZoomComplete])

  const handleControlsStart = useCallback(() => {
    userOverride.current = true
    planetZoomComplete.current = true
    if (overviewZoomActive) finishOverviewZoom()
  }, [overviewZoomActive, finishOverviewZoom])

  useFrame((state, delta) => {
    if (landingPadRef.current) {
      const material = landingPadRef.current.material as THREE.MeshStandardMaterial
      material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.2
    }

    if (overviewZoomActive && !userOverride.current && !overviewCompleteFired.current) {
      overviewProgress.current = Math.min(overviewProgress.current + delta * 0.55, 1)
      const eased = 1 - Math.pow(1 - overviewProgress.current, 3)
      camera.position.lerpVectors(overviewFromPos.current, overviewCameraPos, eased)
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(overviewFromTarget.current, centroid, eased)
        controlsRef.current.update()
      }
      if (overviewProgress.current >= 1) finishOverviewZoom()
      return
    }

    if (zoomTarget && !planetZoomComplete.current && !userOverride.current) {
      planetZoomProgress.current = Math.min(planetZoomProgress.current + delta * 1.5, 1)
      const eased = 1 - Math.pow(1 - planetZoomProgress.current, 3)
      camera.position.lerpVectors(planetZoomFrom.current, planetZoomTo.current, eased)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(planetZoomLookAt.current, eased * 0.12 + 0.04)
        controlsRef.current.update()
      }
      if (planetZoomProgress.current >= 1) planetZoomComplete.current = true
    }
  })

  const handlePlanetClick = useCallback(
    (stage: TrainingStage, index: number) => {
      if (unlockedIndices.has(index)) onPlanetClick(stage, index)
    },
    [unlockedIndices, onPlanetClick],
  )

  return (
    <>
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 40, 120]} />

      <ambientLight intensity={0.18} />
      <directionalLight position={[30, 15, 20]} intensity={1.8} color="#fff5e8" />
      <directionalLight position={[-20, -10, -15]} intensity={0.3} color="#4477ff" />

      <Nebula />
      <Starfield parallaxRef={parallaxRef} />

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={dustPositions} count={200} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#8899bb" size={0.04} transparent opacity={0.4} sizeAttenuation />
      </points>

      {TRAINING_STAGES.map((stage, index) => {
        const unlocked = unlockedIndices.has(index)
        const isUnlocking = burstingPlanetIndex === index
        const progress = isUnlocking ? unlockProgress : 0

        return (
          <group key={stage.id}>
            <Planet
              stage={stage}
              planetIndex={index}
              unlocked={unlocked || isUnlocking}
              unlockProgress={progress}
              onClick={() => handlePlanetClick(stage, index)}
              isSelected={selectedStage?.id === stage.id}
              onHover={onPlanetHover}
            />
            {isUnlocking && (
              <ParticleBurst
                position={stage.position}
                color={stage.emissive}
                active
                onComplete={onBurstComplete}
              />
            )}
          </group>
        )
      })}

      <CurrentPlanetIndicator stage={TRAINING_STAGES[currentIndex]} active />

      <mesh
        ref={landingPadRef}
        position={[
          TRAINING_STAGES[currentIndex].position[0],
          TRAINING_STAGES[currentIndex].position[1] + TRAINING_STAGES[currentIndex].size * 0.99,
          TRAINING_STAGES[currentIndex].position[2],
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.18, 0.28, 32]} />
        <meshStandardMaterial
          color="#00ffcc"
          emissive="#00ffcc"
          emissiveIntensity={3}
          transparent
          opacity={0.6}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Rocket
        position={rocketPosition}
        targetPosition={rocketTarget}
        isFlying={isFlying}
        onLand={onRocketLand}
        trailColor={trailColor}
        currentCourse={TRAINING_STAGES[currentIndex]}
      />

      <OrbitControls
        ref={controlsRef}
        target={[centroid.x, centroid.y, centroid.z]}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.6}
        enablePan
        minDistance={3}
        maxDistance={30}
        enableZoom
        enabled
        makeDefault
        onStart={handleControlsStart}
      />
    </>
  )
}
