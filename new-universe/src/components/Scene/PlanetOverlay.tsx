import { Html } from '@react-three/drei'
import { Padlock3D } from './Padlock3D'
import type { Course } from '../../data/courses'

interface PlanetOverlayProps {
  course: Course
  unlocked: boolean
  isUnlocking?: boolean
  unlockProgress?: number
}

export function PlanetOverlay({ course, unlocked, isUnlocking, unlockProgress = 0 }: PlanetOverlayProps) {
  const showLabel = unlocked || (isUnlocking && unlockProgress > 0.6)

  return (
    <group position={course.position}>
      {!unlocked && !isUnlocking && <Padlock3D scale={course.size * 0.5} />}

      {showLabel && (
        <Html
          position={[course.size + 0.8, course.size * 0.3, 0]}
          center
          distanceFactor={12}
          transform
          occlude="blending"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
            style={{
              background: 'rgba(10, 10, 26, 0.8)',
              border: `1px solid ${course.emissive}66`,
              color: course.emissive,
              textShadow: `0 0 8px ${course.emissive}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            {course.name}
          </div>
        </Html>
      )}
    </group>
  )
}
