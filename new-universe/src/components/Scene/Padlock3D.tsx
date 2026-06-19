import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export function Padlock3D({ scale = 1 }: { scale?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = 2.5 + Math.sin(clock.getElapsedTime() * 1.5) * 0.15
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      <Html center position={[0, 0.6, 0]} distanceFactor={5}>
        <div style={{
          background: "linear-gradient(135deg, rgba(80,40,120,0.9), rgba(40,20,80,0.9))",
          border: "1.5px solid rgba(180,120,255,0.7)",
          borderRadius: "50%",
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          boxShadow: "0 0 16px rgba(150,80,255,0.6), 0 0 32px rgba(150,80,255,0.2)",
          backdropFilter: "blur(4px)",
        }}>
          🔒
        </div>
      </Html>
    </group>
  )
}
