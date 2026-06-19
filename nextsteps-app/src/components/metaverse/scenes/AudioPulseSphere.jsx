import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Simplified three-js-audio-visualiser — pulsing particle torus */
export default function AudioPulseSphere({ count = 1200 }) {
  const points = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2
      const r = 2.2 + Math.random() * 0.8
      arr[i * 3] = Math.cos(t) * r
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2.5
      arr[i * 3 + 2] = Math.sin(t) * r
    }
    return arr
  }, [count])

  useFrame(({ clock }) => {
    if (!points.current) return
    const pos = points.current.geometry.attributes.position.array
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const baseT = (i / count) * Math.PI * 2
      const pulse = 1 + Math.sin(t * 3 + baseT * 4) * 0.25
      const r = (2.2 + Math.sin(t * 2 + i * 0.02) * 0.5) * pulse
      pos[i * 3] = Math.cos(baseT + t * 0.3) * r
      pos[i * 3 + 1] = Math.sin(t * 2 + i * 0.05) * 1.2
      pos[i * 3 + 2] = Math.sin(baseT + t * 0.3) * r
    }
    points.current.geometry.attributes.position.needsUpdate = true
    points.current.rotation.y = t * 0.15
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#7b5cf5"
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
