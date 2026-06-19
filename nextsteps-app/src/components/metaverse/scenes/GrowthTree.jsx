import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BRANCH_COLORS = ['#72cbdb', '#7b5cf5', '#f7c948', '#4361ee', '#ef7351']

function BranchLine({ start, end, depth, maxDepth, colorIdx }) {
  const ref = useRef()
  const color = BRANCH_COLORS[colorIdx % BRANCH_COLORS.length]
  const progress = 1 - depth / maxDepth

  const { mid, quat, len } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(end, start)
    const length = dir.length()
    const mid = start.clone().add(dir.multiplyScalar(0.5))
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    )
    return { mid, quat, len: length }
  }, [start, end])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.scale.y =
      len * (0.3 + Math.min(1, (Math.sin(clock.elapsedTime * 1.5 + depth) + 1) * 0.35 + progress * 0.4))
  })

  return (
    <mesh ref={ref} position={mid} quaternion={quat} scale={[0.04 * progress + 0.02, len, 0.04 * progress + 0.02]}>
      <cylinderGeometry args={[1, 0.6, 1, 5]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  )
}

function growTree(pos, angle, depth, maxDepth, len, branches, colorRef) {
  if (depth >= maxDepth) return
  const rad = (angle * Math.PI) / 180
  const end = new THREE.Vector3(
    pos.x + Math.cos(rad) * len,
    pos.y + Math.sin(rad) * len,
    pos.z,
  )
  branches.push({ start: pos.clone(), end, depth, maxDepth, colorIdx: colorRef.count++ })
  const nextLen = len * 0.78
  growTree(end, angle - 28 + Math.random() * 8, depth + 1, maxDepth, nextLen, branches, colorRef)
  growTree(end, angle + 28 - Math.random() * 8, depth + 1, maxDepth, nextLen, branches, colorRef)
}

export default function GrowthTree() {
  const group = useRef()
  const branches = useMemo(() => {
    const list = []
    const colorRef = { count: 0 }
    growTree(new THREE.Vector3(0, -2, 0), -90, 0, 7, 1.8, list, colorRef)
    return list
  }, [])

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.z = Math.sin(clock.elapsedTime * 0.2) * 0.05
  })

  return (
    <group ref={group} position={[0, 0, 0]}>
      {branches.map((b, i) => (
        <BranchLine key={i} {...b} />
      ))}
    </group>
  )
}
