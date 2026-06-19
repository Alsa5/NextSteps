import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Inspired by city-3d CodePen — procedural skyline with fog */
function Building({ position, scale, rotationSpeed }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += rotationSpeed * delta
  })
  return (
    <group position={position}>
      <mesh ref={ref} scale={scale} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0a0a12" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh scale={[scale[0] * 1.02, scale[1] * 1.02, scale[2] * 1.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.04} />
      </mesh>
    </group>
  )
}

export default function NebulaCity() {
  const buildings = useMemo(() => {
    const items = []
    for (let i = 0; i < 72; i++) {
      const x = (Math.random() - 0.5) * 14
      const z = (Math.random() - 0.5) * 14
      const h = 0.15 + Math.random() * 2.2
      items.push({
        position: [x, h / 2 - 0.5, z],
        scale: [0.4 + Math.random() * 0.5, h, 0.4 + Math.random() * 0.5],
        rotationSpeed: 0.02 + Math.random() * 0.08,
      })
    }
    return items
  }, [])

  return (
    <>
      <fog attach="fog" args={['#1a0a2e', 8, 22]} />
      <color attach="background" args={['#1a0a2e']} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#7b5cf5" />
      <directionalLight position={[-5, 4, -3]} intensity={0.4} color="#4361ee" />
      <group position={[0, -1.2, 0]}>
        {buildings.map((b, i) => (
          <Building key={i} {...b} />
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
          <planeGeometry args={[24, 24]} />
          <meshStandardMaterial color="#050508" />
        </mesh>
      </group>
    </>
  )
}
