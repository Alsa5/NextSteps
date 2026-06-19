import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring } from '@react-spring/three'
import * as THREE from 'three'
import type { Course } from '../data/courses'

interface PlanetShaderProps {
  course: Course
  unlocked: boolean
  unlockProgress: number
}

export function usePlanetShader({ course, unlocked, unlockProgress }: PlanetShaderProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  useSpring({
    unlockedValue: unlocked ? 1.0 : unlockProgress,
    config: { mass: 1, tension: 120, friction: 14 },
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(course.color) },
    uEmissive: { value: new THREE.Color(course.emissive) },
    uUnlocked: { value: unlocked ? 1.0 : 0.0 },
  }), [course.color, course.emissive, unlocked])

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uEmissive;
    uniform float uTime;
    uniform float uUnlocked;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Base color — visible dark blue when locked, vivid when unlocked
      vec3 lockedColor = vec3(0.09, 0.13, 0.24);  // #16213e
      vec3 baseColor = mix(lockedColor, uColor, uUnlocked);
      
      // Enhanced surface shimmer animation
      float shimmer = sin(uTime * 1.8 + vPosition.y * 4.0) * 0.12;
      baseColor += shimmer * uUnlocked;
      
      // Enhanced surface detail (radial noise)
      float noise = sin(vPosition.x * 10.0 + uTime * 0.4) * cos(vPosition.z * 8.0 + uTime * 0.3) * 0.08;
      baseColor += noise * uUnlocked * uColor * 0.5;
      
      // Add emissive glow - locked planets get subtle blue glow
      vec3 lockedEmissive = vec3(0.06, 0.2, 0.38);  // #0f3460
      vec3 emissiveColor = mix(lockedEmissive, uEmissive, uUnlocked);
      float emissiveStrength = mix(0.6, 0.4, uUnlocked);
      baseColor += emissiveColor * emissiveStrength;
      
      gl_FragColor = vec4(baseColor, 1.0);
    }
  `

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uUnlocked.value = unlocked ? 1.0 : unlockProgress
    }
  })

  return { materialRef, uniforms, vertexShader, fragmentShader }
}

export function useAtmosphereShader({ course, unlocked, unlockProgress }: PlanetShaderProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(course.color).multiplyScalar(1.6) },
    uUnlocked: { value: unlocked ? 1.0 : 0.0 },
  }), [course.color, unlocked])

  const vertexShader = `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uUnlocked;
    varying vec3 vNormal;
    
    void main() {
      // Enhanced Fresnel effect — bright at edges, transparent in center
      float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
      fresnel = pow(fresnel, 2.2);
      
      vec3 atmosphereColor = uColor;
      float alpha = fresnel * 0.8 * uUnlocked;
      
      gl_FragColor = vec4(atmosphereColor, alpha);
    }
  `

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uUnlocked.value = unlocked ? 1.0 : unlockProgress
    }
  })

  return { materialRef, uniforms, vertexShader, fragmentShader }
}