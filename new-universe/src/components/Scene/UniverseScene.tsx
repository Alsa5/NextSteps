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
import { COURSES } from '../../data/courses'
import type { Course } from '../../data/courses'

interface UniverseSceneProps {
  unlockedIndices: Set<number>
  currentIndex: number
  selectedCourse: Course | null
  isFlying: boolean
  flyTargetIndex: number | null
  unlockProgress: number
  burstingPlanetIndex: number | null
  onPlanetClick: (course: Course, index: number) => void
  onRocketLand: () => void
  onBurstComplete: () => void
  zoomTarget: THREE.Vector3 | null
  parallaxRef: MutableRefObject<{ x: number; y: number }>
  onPlanetHover: (course: Course | null) => void
}

export function UniverseScene({
  unlockedIndices,
  currentIndex,
  selectedCourse,
  isFlying,
  flyTargetIndex,
  unlockProgress,
  burstingPlanetIndex,
  onPlanetClick,
  onRocketLand,
  onBurstComplete,
  zoomTarget,
  parallaxRef,
  onPlanetHover,
}: UniverseSceneProps) {
  const controlsRef = useRef<any>(null)
  const landingPadRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()
  const zoomProgress = useRef(0)
  const isZooming = useRef(false)
  const zoomFrom = useRef(new THREE.Vector3())
  const zoomToPos = useRef(new THREE.Vector3())
  const zoomLookAt = useRef(new THREE.Vector3())
  const initialFocusDone = useRef(false)

  useEffect(() => {
    const canvas = gl.domElement
    const preventDblClick = (e: Event) => {
      e.stopPropagation()
      e.preventDefault()
    }
    canvas.addEventListener('dblclick', preventDblClick, true)
    return () => canvas.removeEventListener('dblclick', preventDblClick, true)
  }, [gl])

  useEffect(() => {
    if (initialFocusDone.current) return
    initialFocusDone.current = true
    // Let OrbitControls handle natural zoom-to-cursor behavior
  }, [camera, currentIndex])

  const centroid = useMemo(() => {
    return COURSES.reduce((acc, c) => ({
      x: acc.x + c.position[0] / COURSES.length,
      y: acc.y + c.position[1] / COURSES.length,
      z: acc.z + c.position[2] / COURSES.length
    }), { x: 0, y: 0, z: 0 })
  }, [])

  const rocketPosition = useMemo(() => {
    const planetPos = new THREE.Vector3(...COURSES[currentIndex].position)
    // Rocket lands ON planet surface (not floating above)
    return planetPos
  }, [currentIndex])

  const rocketTarget = useMemo(() => {
    if (!isFlying || flyTargetIndex === null) return null
    const targetPos = new THREE.Vector3(...COURSES[flyTargetIndex].position)
    return targetPos
  }, [isFlying, flyTargetIndex])

  const trailColor = useMemo(() => {
    if (flyTargetIndex !== null) return COURSES[flyTargetIndex].emissive
    return COURSES[currentIndex].emissive
  }, [flyTargetIndex, currentIndex])

  // Space dust particles for realism
  const dustPositions = useMemo(() => {
    const positions = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return positions
  }, [])

  useFrame((state, delta) => {
    // Landing pad pulse animation
    if (landingPadRef.current) {
      const material = landingPadRef.current.material as THREE.MeshStandardMaterial
      material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.2
    }

    if (zoomTarget && !isZooming.current) {
      isZooming.current = true
      zoomProgress.current = 0
      zoomFrom.current.copy(camera.position)
      zoomLookAt.current.copy(zoomTarget)
      zoomToPos.current.copy(zoomTarget).add(new THREE.Vector3(3, 2, 5))
    }

    if (isZooming.current && zoomTarget) {
      zoomProgress.current += delta * 1.5
      const t = Math.min(zoomProgress.current, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      camera.position.lerpVectors(zoomFrom.current, zoomToPos.current, eased)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(zoomLookAt.current, eased * 0.1 + 0.05)
      }
      if (t >= 1) isZooming.current = false
    }

    if (!zoomTarget) isZooming.current = false
  })

  const handlePlanetClick = useCallback(
    (course: Course, index: number) => {
      if (unlockedIndices.has(index)) onPlanetClick(course, index)
    },
    [unlockedIndices, onPlanetClick],
  )

  return (
    <>
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 40, 120]} />

      {/* Realistic space lighting - softer shadows */}
      <ambientLight intensity={0.18} />
      <directionalLight position={[30, 15, 20]} intensity={1.8} color="#fff5e8" />
      <directionalLight position={[-20, -10, -15]} intensity={0.3} color="#4477ff" />

      <Nebula />
      <Starfield parallaxRef={parallaxRef} />
      
      {/* Space dust particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={dustPositions}
            count={200}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#8899bb"
          size={0.04}
          transparent
          opacity={0.4}
          sizeAttenuation={true}
        />
      </points>

      {COURSES.map((course, index) => {
        const unlocked = unlockedIndices.has(index)
        const isUnlocking = burstingPlanetIndex === index
        const progress = isUnlocking ? unlockProgress : 0

        return (
          <group key={course.id}>
            <Planet
              course={course}
              unlocked={unlocked || isUnlocking}
              unlockProgress={progress}
              onClick={() => handlePlanetClick(course, index)}
              isSelected={selectedCourse?.id === course.id}
              onHover={onPlanetHover}
            />
            {isUnlocking && (
              <ParticleBurst
                position={course.position}
                color={course.emissive}
                active
                onComplete={onBurstComplete}
              />
            )}
          </group>
        )
      })}

      <CurrentPlanetIndicator course={COURSES[currentIndex]} active />

      {/* Landing pad under rocket on current planet */}
      <mesh
        ref={landingPadRef}
        position={[
          COURSES[currentIndex].position[0],
          COURSES[currentIndex].position[1] + COURSES[currentIndex].size * 0.99,
          COURSES[currentIndex].position[2]
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
        currentCourse={COURSES[currentIndex]}
      />

      <OrbitControls
        ref={controlsRef}
        target={[centroid.x, centroid.y, centroid.z]}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        panSpeed={0.6}
        enablePan={true}
        minDistance={3}
        maxDistance={30}
        enableZoom={true}
      />
    </>
  )
}
