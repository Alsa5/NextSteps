import { Html } from '@react-three/drei'
import { Padlock3D } from './Padlock3D'
import type { TrainingStage } from '../../data/trainingStages'

interface PlanetOverlayProps {
  TrainingStage: TrainingStage
  unlocked: boolean
  isUnlocking?: boolean
  unlockProgress?: number
}

export function PlanetOverlay({ TrainingStage, unlocked, isUnlocking, unlockProgress = 0 }: PlanetOverlayProps) {
  const showLabel = unlocked || (isUnlocking && unlockProgress > 0.6)

  return (
    <group position={TrainingStage.position}>
      {!unlocked && !isUnlocking && <Padlock3D scale={TrainingStage.size * 0.5} />}

      {showLabel && (
        <Html
          position={[TrainingStage.size + 0.8, TrainingStage.size * 0.3, 0]}
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
              border: `1px solid ${TrainingStage.emissive}66`,
              color: TrainingStage.emissive,
              textShadow: `0 0 8px ${TrainingStage.emissive}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            {TrainingStage.name}
          </div>
        </Html>
      )}
    </group>
  )
}
