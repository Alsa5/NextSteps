import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'

interface StarfieldProps {
  parallaxRef: React.MutableRefObject<{ x: number; y: number }>
}

export function Starfield({ parallaxRef }: StarfieldProps) {
  const starsRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!starsRef.current || !parallaxRef.current) return
    starsRef.current.rotation.x += parallaxRef.current.y * 0.0001
    starsRef.current.rotation.y += parallaxRef.current.x * 0.0001
  })

  return (
    <group ref={starsRef}>
      {/* Main star layer */}
      <Stars
        radius={120}
        depth={80}
        count={7000}
        factor={5}
        saturation={0.4}
        fade
        speed={0.8}
      />
      
      {/* Bright foreground stars */}
      <Stars
        radius={60}
        depth={20}
        count={400}
        factor={8}
        saturation={0.8}
        fade
        speed={0.3}
      />
    </group>
  )
}
