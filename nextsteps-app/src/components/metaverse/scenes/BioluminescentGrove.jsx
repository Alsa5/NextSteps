import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { NEBULA_COLORS } from '../../../theme/maverickNebula'

const RULES = { X: 'F[-FY][+FY]', Y: 'F[&FX][^FX]' }
const AXiom = 'FFFX'

const expandLSystem = (axiom, rules, iterations) => {
  let s = axiom
  for (let i = 0; i < iterations; i++) {
    s = s
      .split('')
      .map((c) => rules[c] || c)
      .join('')
  }
  return s
}

const buildSegments = (instruction, settings) => {
  const stack = []
  const segments = []
  let pos = new THREE.Vector3(0, 0, 0)
  let dir = new THREE.Vector3(0, 1, 0)
  let len = settings.initialLength
  let thick = settings.initialThickness
  let depth = 0

  for (const char of instruction) {
    if (char === 'F') {
      const end = pos.clone().add(dir.clone().multiplyScalar(len))
      segments.push({
        start: pos.clone(),
        end,
        thickness: thick,
        depth,
      })
      pos = end
    } else if (char === '+') {
      dir.applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(settings.angle))
    } else if (char === '-') {
      dir.applyAxisAngle(new THREE.Vector3(0, 0, 1), -THREE.MathUtils.degToRad(settings.angle))
    } else if (char === '[') {
      stack.push({ pos: pos.clone(), dir: dir.clone(), len, thick, depth })
    } else if (char === ']') {
      const state = stack.pop()
      if (state) {
        pos = state.pos
        dir = state.dir
        len = state.len
        thick = state.thick
        depth = state.depth
      }
    } else if (char === '&' || char === '^') {
      dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(char === '&' ? 25 : -25))
    }
    if (char === 'F' || char === 'X' || char === 'Y') {
      len *= settings.lengthFactor
      thick *= settings.thicknessFactor
      depth += 1
    }
  }
  return segments
}

function Branch({ start, end, thickness, colorIndex }) {
  const ref = useRef()
  const color = NEBULA_COLORS.biolum[colorIndex % NEBULA_COLORS.biolum.length]

  const { mid, quat, scale } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(end, start)
    const length = dir.length()
    const mid = start.clone().add(dir.multiplyScalar(0.5))
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize(),
    )
    return { mid, quat, scale: [thickness * 0.35, length, thickness * 0.35] }
  }, [start, end, thickness])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = 0.65 + Math.sin(clock.elapsedTime * 2 + colorIndex) * 0.35
    ref.current.material.emissiveIntensity = pulse
  })

  return (
    <mesh ref={ref} position={mid} quaternion={quat} scale={scale}>
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        roughness={0.35}
        metalness={0.2}
      />
    </mesh>
  )
}

export default function BioluminescentGrove() {
  const group = useRef()
  const segments = useMemo(() => {
    const instruction = expandLSystem(AXiom, RULES, 5)
    return buildSegments(instruction, {
      initialLength: 1.4,
      initialThickness: 0.5,
      lengthFactor: 0.72,
      thicknessFactor: 0.88,
      angle: 22,
    })
  }, [])

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.12
    }
  })

  return (
    <group ref={group} position={[0, -4, 0]} scale={1.2}>
      {segments.map((seg, i) => (
        <Branch key={i} {...seg} colorIndex={i} />
      ))}
      <pointLight position={[0, 8, 4]} intensity={2} color="#a78bfa" />
      <pointLight position={[-4, 2, -2]} intensity={1.2} color="#4361ee" />
    </group>
  )
}
