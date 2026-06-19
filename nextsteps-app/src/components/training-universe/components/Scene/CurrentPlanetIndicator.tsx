import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { TrainingStage } from '../../data/trainingStages'

interface CurrentPlanetIndicatorProps {
  stage: TrainingStage
  active: boolean
}

export function CurrentPlanetIndicator({ stage, active }: CurrentPlanetIndicatorProps) {
  // Disabled - no more white rings around planets for cleaner look
  return null
}
