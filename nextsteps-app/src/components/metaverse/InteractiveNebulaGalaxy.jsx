import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { NEBULA_COLORS } from '../../theme/maverickNebula'
import './InteractiveNebulaGalaxy.css'

const ARM_COLORS = NEBULA_COLORS.biolum

function NebulaCore({ growth }) {
  const ref = useRef()
  const scale = 0.35 + growth * 0.65

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.08
    ref.current.scale.setScalar(scale * (1 + Math.sin(clock.elapsedTime * 1.2) * 0.04))
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial
        color="#7b5cf5"
        emissive="#4361ee"
        emissiveIntensity={0.85 + growth * 0.4}
        transparent
        opacity={0.75}
      />
    </mesh>
  )
}

function GalaxyArm({ index, growth, total }) {
  const group = useRef()
  const particles = useMemo(() => {
    const count = 120
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const color = new THREE.Color(ARM_COLORS[index % ARM_COLORS.length])

    for (let i = 0; i < count; i += 1) {
      const t = i / count
      const angle = (index / total) * Math.PI * 2 + t * Math.PI * 1.6
      const radius = 1.5 + t * (4 + growth * 3)
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.35 * (1 - t)
      positions[i * 3 + 2] = Math.sin(angle) * radius
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { positions, colors, count }
  }, [index, total, growth])

  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.rotation.y = clock.elapsedTime * (0.04 + index * 0.008)
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particles.count} array={particles.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={particles.count} array={particles.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06 + growth * 0.05} vertexColors transparent opacity={0.85} sizeAttenuation />
      </points>
    </group>
  )
}

function ScrollDust({ growth }) {
  const ref = useRef()
  const count = 400

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 14
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.02
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.3) * 0.15
  })

  return (
    <points ref={ref} scale={[0.6 + growth * 0.9, 0.6 + growth * 0.9, 0.6 + growth * 0.9]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#a78bfa" transparent opacity={0.35 + growth * 0.35} sizeAttenuation />
    </points>
  )
}

function GalaxyScene({ growth }) {
  const arms = 4

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 2, 0]} intensity={1.2 + growth} color="#7b5cf5" />
      <pointLight position={[-4, -2, 3]} intensity={0.6} color="#4361ee" />
      <NebulaCore growth={growth} />
      {Array.from({ length: arms }, (_, i) => (
        <GalaxyArm key={i} index={i} growth={growth} total={arms} />
      ))}
      <ScrollDust growth={growth} />
      <Stars radius={60} depth={40} count={2500} factor={2.5} fade speed={0.35} />
      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={4}
        maxDistance={18}
        autoRotate
        autoRotateSpeed={0.25 + growth * 0.35}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 4}
      />
    </>
  )
}

export default function InteractiveNebulaGalaxy({ growth = 0.45, className = '' }) {
  return (
    <div className={`interactive-nebula-galaxy ${className}`.trim()} aria-hidden="true">
      <div className="interactive-nebula-galaxy__hint">
        Drag to orbit · Scroll to expand the Nebula
      </div>
      <Canvas camera={{ position: [0, 2.5, 10], fov: 52 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#0a0818']} />
        <fog attach="fog" args={['#0a0818', 12, 28]} />
        <Suspense fallback={null}>
          <GalaxyScene growth={growth} />
        </Suspense>
      </Canvas>
      <div className="interactive-nebula-galaxy__vignette" />
    </div>
  )
}
