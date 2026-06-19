import * as THREE from 'three'

// Subtle nebula - much reduced visibility
const NEBULAE = [
  { color: '#1a0f2e', position: [-50, 15, -60] as [number, number, number], scale: 30, opacity: 0.02 },
  { color: '#0f2e1a', position: [50, -10, -40] as [number, number, number], scale: 28, opacity: 0.015 },
]

export function Nebula() {
  return (
    <group>
      {NEBULAE.map((n, i) => (
        <mesh key={i} position={n.position} scale={n.scale}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={n.color}
            transparent
            opacity={n.opacity}
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}
