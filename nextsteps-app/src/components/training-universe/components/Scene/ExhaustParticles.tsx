import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 80

interface ExhaustParticlesProps {
  active: boolean
  position?: [number, number, number]
}

export function ExhaustParticles({ active, position = [0, 0, 0] }: ExhaustParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const agesRef = useRef<Float32Array>(new Float32Array(COUNT))
  const emissionRateRef = useRef(0.1)

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)
    
    for (let i = 0; i < COUNT; i++) {
      // Initialize off-screen, staggered emission
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      
      agesRef.current[i] = -i / COUNT / emissionRateRef.current
      
      // Downward spread cone velocity
      const angle = Math.random() * Math.PI * 2
      const spread = Math.random() * 0.4
      velocities[i * 3] = Math.cos(angle) * spread
      velocities[i * 3 + 1] = -2.5 - Math.random() * 1.5
      velocities[i * 3 + 2] = Math.sin(angle) * spread
    }
    return { positions, velocities }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const ageAttr = pointsRef.current.geometry.attributes.age as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array
    const ageArr = ageAttr.array as Float32Array

    for (let i = 0; i < COUNT; i++) {
      agesRef.current[i] += delta * emissionRateRef.current

      if (agesRef.current[i] >= 1.0) {
        // Recycle particle
        agesRef.current[i] = 0
        posArr[i * 3] = 0
        posArr[i * 3 + 1] = 0
        posArr[i * 3 + 2] = 0
      } else if (agesRef.current[i] >= 0) {
        posArr[i * 3] += velocities[i * 3] * delta
        posArr[i * 3 + 1] += velocities[i * 3 + 1] * delta
        posArr[i * 3 + 2] += velocities[i * 3 + 2] * delta
      }

      ageArr[i] = Math.max(0, agesRef.current[i])
    }

    posAttr.needsUpdate = true
    ageAttr.needsUpdate = true
  })

  if (!active) return null

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-age" count={COUNT} array={agesRef.current} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        uniforms={{
          uColor: { value: new THREE.Color('#ff6600') },
          uColorEnd: { value: new THREE.Color('#ffdd00') },
        }}
        vertexShader={`
          attribute float age;
          varying float vAge;
          
          void main() {
            vAge = age;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (1.0 - vAge) * 8.0;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform vec3 uColorEnd;
          varying float vAge;
          
          void main() {
            float alpha = 1.0 - vAge;
            vec3 color = mix(uColor, uColorEnd, vAge);
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </points>
  )
}
