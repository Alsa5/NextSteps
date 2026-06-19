import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { TRAINING_STAGES } from '../../data/trainingStages'

interface PlanetConnectionsProps {
  unlockedIndices: Set<number>
}

export function PlanetConnections({ unlockedIndices }: PlanetConnectionsProps) {
  const segments = useMemo(() => {
    return TRAINING_STAGES.slice(0, -1).map((TrainingStage, i) => {
      const next = TRAINING_STAGES[i + 1]
      const bothUnlocked = unlockedIndices.has(i) && unlockedIndices.has(i + 1)
      
      return {
        key: `${TrainingStage.id}-${next.id}`,
        points: [
          new THREE.Vector3(...TrainingStage.position),
          new THREE.Vector3(...next.position),
        ] as [THREE.Vector3, THREE.Vector3],
        color: bothUnlocked ? TrainingStage.color : '#334155',
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
