import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleBurstProps {
  position: [number, number, number]
  color: string
  active: boolean
  onComplete?: () => void
}

const PARTICLE_COUNT = 200

export function ParticleBurst({ position, color, active, onComplete }: ParticleBurstProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const startTime = useRef(0)
  const wasActive = useRef(false)

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const c = new THREE.Color(color)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 2 + Math.random() * 6

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      velocities[i * 3 + 2] = Math.cos(phi) * speed

      const hueShift = (Math.random() - 0.5) * 0.2
      const particleColor = c.clone().offsetHSL(hueShift, 0, 0.1)
      colors[i * 3] = particleColor.r
      colors[i * 3 + 1] = particleColor.g
      colors[i * 3 + 2] = particleColor.b
    }

    return { positions, velocities, colors }
  }, [color])

  useEffect(() => {
    if (active && !wasActive.current) {
      startTime.current = performance.now() / 1000
    }
    wasActive.current = active
  }, [active])

  useFrame(({ clock }) => {
    if (!pointsRef.current || !active) return

    const elapsed = clock.getElapsedTime() - startTime.current
    if (elapsed > 2.5) {
      onComplete?.()
      return
    }

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = velocities[i * 3] * elapsed
      arr[i * 3 + 1] = velocities[i * 3 + 1] * elapsed - 0.5 * 9.8 * elapsed * elapsed
      arr[i * 3 + 2] = velocities[i * 3 + 2] * elapsed
    }
    posAttr.needsUpdate = true

    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = Math.max(0, 1 - elapsed / 2.5)
  })

  if (!active) return null

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions.slice()} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
