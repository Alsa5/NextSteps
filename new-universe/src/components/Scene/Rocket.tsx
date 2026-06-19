import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import type { Course } from '../../data/courses'

interface RocketProps {
  position: THREE.Vector3
  targetPosition: THREE.Vector3 | null
  isFlying: boolean
  onLand: () => void
  trailColor?: string
}

function SciFiRocket({ fromPos, toPos, flying, onArrived, currentCourse }: {
  fromPos: [number, number, number]
  toPos: [number, number, number] | null
  flying: boolean
  onArrived: () => void
  currentCourse?: Course
}) {
  const groupRef = useRef<THREE.Group>(null)
  const flameRef = useRef<THREE.Mesh>(null)
  const flame2Ref = useRef<THREE.Mesh>(null)
  const progress = useRef(0)
  const arrived = useRef(false)

  useEffect(() => {
    if (flying) {
      progress.current = 0
      arrived.current = false
    }
  }, [flying])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (flying && toPos && !arrived.current) {
      progress.current = Math.min(progress.current + delta * 0.35, 1)
      const p = progress.current
      const from = new THREE.Vector3(...fromPos)
      const to = new THREE.Vector3(...toPos)
      const mid = new THREE.Vector3(
        (from.x + to.x) / 2,
        Math.max(from.y, to.y) + 5,
        (from.z + to.z) / 2
      )

      const pos = new THREE.Vector3(
        (1-p)*(1-p)*from.x + 2*(1-p)*p*mid.x + p*p*to.x,
        (1-p)*(1-p)*from.y + 2*(1-p)*p*mid.y + p*p*to.y,
        (1-p)*(1-p)*from.z + 2*(1-p)*p*mid.z + p*p*to.z
      )
      groupRef.current.position.copy(pos)

      // Point rocket in direction of travel
      if (p < 0.98) {
        const np = Math.min(p + 0.02, 1)
        const nextPos = new THREE.Vector3(
          (1-np)*(1-np)*from.x + 2*(1-np)*np*mid.x + np*np*to.x,
          (1-np)*(1-np)*from.y + 2*(1-np)*np*mid.y + np*np*to.y,
          (1-np)*(1-np)*from.z + 2*(1-np)*np*mid.z + np*np*to.z
        )
        groupRef.current.lookAt(nextPos)
        // Rocket nose points forward - correct orientation
        groupRef.current.rotateX(Math.PI / 2)
      }

      if (progress.current >= 1 && !arrived.current) {
        arrived.current = true
        onArrived?.()
      }
    } else if (!flying) {
      // Idle: land ON planet surface - very stable hover
      const planetSize = currentCourse?.size || 0.7
      groupRef.current.position.set(
        fromPos[0],
        fromPos[1] + planetSize + 0.12 + Math.sin(t * 0.8) * 0.02,
        fromPos[2]
      )
      // Stand upright on planet - minimal rotation
      groupRef.current.rotation.set(0, groupRef.current.rotation.y + delta * 0.2, 0)
    }

    // Animate flames
    if (flameRef.current) {
      const scale = flying
        ? 2.8 + Math.sin(t * 30) * 0.7
        : 0.8 + Math.sin(t * 15) * 0.2
      flameRef.current.scale.y = scale
      const material = flameRef.current.material as THREE.MeshStandardMaterial
      material.opacity = flying ? 0.95 : 0.7
    }
    if (flame2Ref.current) {
      const scale = flying
        ? 1.8 + Math.sin(t * 25 + 1) * 0.5
        : 0.5 + Math.sin(t * 18 + 1) * 0.15
      flame2Ref.current.scale.y = scale
    }
  })

  return (
    <group ref={groupRef} position={fromPos}>
      <Trail
        width={flying ? 1.4 : 0.05}
        length={10}
        color="#60a5fa"
        attenuation={(t) => t * t * t}
      >
        <group scale={0.42}>
          {/* ── MAIN BODY ── white/silver capsule */}
          <mesh position={[0, 0.1, 0]}>
            <capsuleGeometry args={[0.18, 0.55, 12, 24]} />
            <meshPhysicalMaterial
              color="#dce8f5"
              metalness={0.85}
              roughness={0.12}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              reflectivity={1}
              toneMapped={false}
            />
          </mesh>

          {/* ── NOSE CONE ── pointed top, glowing blue tip */}
          <mesh position={[0, 0.65, 0]}>
            <coneGeometry args={[0.18, 0.45, 16]} />
            <meshPhysicalMaterial
              color="#b8d4f0"
              metalness={0.9}
              roughness={0.08}
              clearcoat={1}
              emissive="#2266ff"
              emissiveIntensity={0.4}
              toneMapped={false}
            />
          </mesh>

          {/* ── NOSE TIP ── bright glowing point */}
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial
              color="#88ccff"
              emissive="#4499ff"
              emissiveIntensity={6}
              toneMapped={false}
            />
          </mesh>

          {/* ── PORTHOLE WINDOW ── dark glass with glow */}
          <mesh position={[0, 0.18, 0.17]}>
            <circleGeometry args={[0.085, 16]} />
            <meshStandardMaterial
              color="#001133"
              emissive="#0044ff"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>

          {/* Window rim */}
          <mesh position={[0, 0.18, 0.165]}>
            <ringGeometry args={[0.085, 0.11, 16]} />
            <meshStandardMaterial
              color="#aaccee"
              metalness={1}
              roughness={0.1}
              toneMapped={false}
            />
          </mesh>

          {/* ── BODY STRIPE ── colored band around middle */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.185, 0.185, 0.08, 16]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff4400"
              emissiveIntensity={1.5}
              toneMapped={false}
            />
          </mesh>

          {/* ── 3 SWEPT FINS ── at base, angled outward */}
          {[0, 1, 2].map(i => (
            <group
              key={i}
              rotation={[0, (i * Math.PI * 2) / 3, 0]}
            >
              <mesh position={[0.22, -0.32, 0]} rotation={[0.3, 0, 0.35]}>
                <boxGeometry args={[0.07, 0.32, 0.18]} />
                <meshPhysicalMaterial
                  color="#c8ddf0"
                  metalness={0.9}
                  roughness={0.15}
                  clearcoat={0.8}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}

          {/* ── ENGINE BELL ── gold/brass nozzle */}
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.14, 0.2, 0.14, 16]} />
            <meshStandardMaterial
              color="#ffaa22"
              emissive="#ff6600"
              emissiveIntensity={2}
              metalness={1.0}
              roughness={0.0}
              toneMapped={false}
            />
          </mesh>

          {/* ── OUTER FLAME ── wide orange */}
          <mesh
            ref={flameRef}
            position={[0, -0.82, 0]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.13, 0.6, 12]} />
            <meshStandardMaterial
              color="#ff7700"
              emissive="#ff9900"
              emissiveIntensity={8}
              transparent
              opacity={0.85}
              toneMapped={false}
            />
          </mesh>

          {/* ── INNER FLAME ── bright yellow core */}
          <mesh
            ref={flame2Ref}
            position={[0, -0.78, 0]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.065, 0.45, 8]} />
            <meshStandardMaterial
              color="#ffee44"
              emissive="#ffffff"
              emissiveIntensity={12}
              transparent
              opacity={0.9}
              toneMapped={false}
            />
          </mesh>

          {/* ── ROCKET LIGHTS ── 3 point lights */}
          <pointLight
            color="#4488ff"
            intensity={5}
            distance={3}
            position={[0, 0.7, 0]}
          />
          <pointLight
            color="#ff6600"
            intensity={flying ? 10 : 4}
            distance={2.5}
            position={[0, -0.85, 0]}
          />
          <pointLight
            color="#ffffff"
            intensity={2}
            distance={1.5}
            position={[0, 0.1, 0.2]}
          />
        </group>
      </Trail>
    </group>
  )
}

export function Rocket({
  position,
  targetPosition,
  isFlying,
  onLand,
  trailColor = '#60a5fa',
  currentCourse,
}: RocketProps & { currentCourse?: Course }) {
  return (
    <SciFiRocket
      fromPos={position.toArray() as [number, number, number]}
      toPos={targetPosition?.toArray() as [number, number, number] | null}
      flying={isFlying}
      onArrived={onLand}
      currentCourse={currentCourse}
    />
  )
}
