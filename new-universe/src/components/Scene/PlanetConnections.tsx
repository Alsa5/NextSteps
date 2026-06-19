import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { COURSES } from '../../data/courses'

interface PlanetConnectionsProps {
  unlockedIndices: Set<number>
}

export function PlanetConnections({ unlockedIndices }: PlanetConnectionsProps) {
  const segments = useMemo(() => {
    return COURSES.slice(0, -1).map((course, i) => {
      const next = COURSES[i + 1]
      const bothUnlocked = unlockedIndices.has(i) && unlockedIndices.has(i + 1)
      
      return {
        key: `${course.id}-${next.id}`,
        points: [
          new THREE.Vector3(...course.position),
          new THREE.Vector3(...next.position),
        ] as [THREE.Vector3, THREE.Vector3],
        color: bothUnlocked ? course.color : '#334155',
        lineWidth: bothUnlocked ? 1.5 : 0.8,
        opacity: bothUnlocked ? 0.5 : 0.25,
        dashed: !bothUnlocked,
        dashSize: 0.3,
        gapSize: 0.2,
      }
    })
  }, [unlockedIndices])

  return (
    <group>
      {segments.map((seg) => (
        <Line
          key={seg.key}
          points={seg.points}
          color={seg.color}
          lineWidth={seg.lineWidth}
          transparent
          opacity={seg.opacity}
          dashed={seg.dashed}
          dashSize={seg.dashSize}
          gapSize={seg.gapSize}
          toneMapped={false}
        />
      ))}
    </group>
  )
}
