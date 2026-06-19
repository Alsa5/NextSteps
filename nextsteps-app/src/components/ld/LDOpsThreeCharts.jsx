import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedBars({ data, maxVal }) {
  const group = useRef()
  const bars = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        x: (i - (data.length - 1) / 2) * 1.4,
        targetH: Math.max(0.3, (d.readiness / maxVal) * 3.5),
        feedbackH: Math.max(0.2, (d.feedback / 100) * 3),
      })),
    [data, maxVal],
  )

  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.elapsedTime
    group.current.children.forEach((child, i) => {
      const bar = bars[i]
      if (!bar || !child) return
      const pulse = 1 + Math.sin(t * 2 + i * 0.8) * 0.04
      child.scale.y = THREE.MathUtils.lerp(child.scale.y, bar.targetH * pulse, 0.08)
      child.position.y = child.scale.y / 2
    })
  })

  return (
    <group ref={group}>
      {bars.map((bar) => (
        <mesh key={bar.id} position={[bar.x, 0, 0]} scale={[0.5, 0.01, 0.5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={bar.health === 'red' ? '#ef7351' : bar.health === 'amber' ? '#f7c948' : '#7b5cf5'}
            emissive={bar.health === 'red' ? '#ef7351' : '#4361ee'}
            emissiveIntensity={0.35}
            metalness={0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

function DataParticles({ count = 400 }) {
  const points = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    return arr
  }, [count])

  useFrame(({ clock }) => {
    if (!points.current) return
    const pos = points.current.geometry.attributes.position.array
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(t + i * 0.1) * 0.002
      if (pos[i * 3 + 1] > 2) pos[i * 3 + 1] = -2
    }
    points.current.geometry.attributes.position.needsUpdate = true
    points.current.rotation.y = t * 0.05
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#4361ee" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function TrackRing({ trackData }) {
  const group = useRef()
  const total = trackData.reduce((s, t) => s + t.count, 0) || 1

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.z = clock.elapsedTime * 0.15
  })

  const colors = ['#4361ee', '#7b5cf5', '#f7c948', '#22c55e']
  let angle = 0

  return (
    <group ref={group}>
      {trackData.map((t, i) => {
        const slice = (t.count / total) * Math.PI * 2
        const mid = angle + slice / 2
        angle += slice
        const r = 2.2
        return (
          <group key={t.track} rotation={[0, 0, mid - Math.PI / 2]}>
            <mesh position={[r, 0, 0]}>
              <sphereGeometry args={[0.15 + (t.count / total) * 0.5, 16, 16]} />
              <meshStandardMaterial color={colors[i % colors.length]} emissive={colors[i % colors.length]} emissiveIntensity={0.4} />
            </mesh>
            <Text position={[r + 0.6, 0, 0]} fontSize={0.22} color="#ece9ff" anchorX="left">
              {t.track}: {t.count}
            </Text>
          </group>
        )
      })}
      <mesh>
        <torusGeometry args={[2.2, 0.04, 8, 64]} />
        <meshStandardMaterial color="#7b5cf5" emissive="#7b5cf5" emissiveIntensity={0.2} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

function Scene({ batchData, trackData }) {
  const maxVal = Math.max(...batchData.map((d) => d.readiness), 1)
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#7b5cf5" />
      <pointLight position={[-4, -2, 3]} intensity={0.6} color="#4361ee" />
      <DataParticles />
      <group position={[-2.5, -1, 0]}>
        <AnimatedBars data={batchData} maxVal={maxVal} />
      </group>
      <group position={[3.5, 0, 0]}>
        <TrackRing trackData={trackData} />
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
    </>
  )
}

export default function LDOpsThreeCharts({ batchData, trackData }) {
  if (!batchData?.length) {
    return (
      <div className="ld-ops-3d ld-ops-3d--empty">
        <p>No active batch data to visualize yet.</p>
      </div>
    )
  }

  return (
    <div className="ld-ops-3d">
      <Canvas camera={{ position: [0, 2.5, 7], fov: 45 }} dpr={[1, 1.5]}>
        <Scene batchData={batchData} trackData={trackData} />
      </Canvas>
      <div className="ld-ops-3d__legend">
        <span><i className="ld-ops-3d__dot ld-ops-3d__dot--violet" /> Batch readiness bars</span>
        <span><i className="ld-ops-3d__dot ld-ops-3d__dot--blue" /> Track distribution ring</span>
        <span><i className="ld-ops-3d__dot ld-ops-3d__dot--particles" /> Live data flow</span>
      </div>
    </div>
  )
}
