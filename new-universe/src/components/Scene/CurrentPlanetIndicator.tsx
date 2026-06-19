import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Course } from '../../data/courses'

interface CurrentPlanetIndicatorProps {
  course: Course
  active: boolean
}

export function CurrentPlanetIndicator({ course, active }: CurrentPlanetIndicatorProps) {
  // Disabled - no more white rings around planets for cleaner look
  return null
}
