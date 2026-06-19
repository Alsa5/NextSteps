import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { a, useSpring } from '@react-spring/three'
import * as THREE from 'three'
import type { Course } from '../../data/courses'

// Safe texture loading hook that never crashes
function useSafeTexture(url: string | undefined): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  
  useEffect(() => {
    if (!url) return

    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        setTexture(tex)
      },
      undefined,
      (err) => {
        console.warn('Texture failed to load:', url, err)
        setTexture(null) // fail silently, fallback to color
      }
    )

    return () => {
      if (texture) texture.dispose()
    }
  }, [url])

  return texture
}

interface PlanetProps {
  course: Course
  unlocked: boolean
  unlockProgress: number
  onClick: () => void
  isSelected: boolean
  onHover: (course: Course | null) => void
}

// Remove PlanetFallback - no longer needed with safe loading

function CloudLayer({ cloudMap, size }: { cloudMap: THREE.Texture; size: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => new THREE.SphereGeometry(size, 32, 32), [size])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.0008
  })

  return (
    <mesh ref={ref} scale={1.02} geometry={geometry} renderOrder={6}>
      <meshStandardMaterial
        map={cloudMap}
        transparent
        opacity={0.35}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

// Rings removed entirely for cleaner look

interface PlanetMeshProps {
  course: Course
  unlocked: boolean
  hovered: boolean
  onClick: () => void
  onHoverIn: () => void
  onHoverOut: () => void
}

function PlanetMesh({ course, unlocked, hovered, onClick, onHoverIn, onHoverOut }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const lockLightRef = useRef<THREE.PointLight>(null)

  // Safe texture loading - never crashes
  const texture = useSafeTexture(course.texture)
  const cloudTexture = useSafeTexture(course.cloudTexture)

  const bodyGeometry = useMemo(() => new THREE.SphereGeometry(course.size, 64, 64), [course.size])

  // Debug texture loading
  useEffect(() => {
    console.log('Texture for', course.name, ':', texture ? 'LOADED' : 'NULL')
    console.log('Path:', course.texture)
  }, [texture, course.name, course.texture])

  // Re-render material when texture loads
  useEffect(() => {
    if (texture && meshRef.current && bodyMaterialRef.current) {
      bodyMaterialRef.current.map = texture
      bodyMaterialRef.current.color.set('#ffffff')
      bodyMaterialRef.current.needsUpdate = true
    }
  }, [texture])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) meshRef.current.rotation.y = t * course.rotationSpeed * 60
    if (bodyMaterialRef.current && unlocked) {
      bodyMaterialRef.current.emissiveIntensity = 0.6 + Math.sin(t * 1.5 + course.id) * 0.2
    }
    if (lockLightRef.current && !unlocked) {
      lockLightRef.current.intensity = 0.3 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.4
    }
  })

  return (
    <>
      {!unlocked && (
        <pointLight ref={lockLightRef} color="#6644aa" intensity={0.15} distance={course.size * 3} decay={2} />
      )}
      {unlocked && (
        <pointLight 
          color={course.color} 
          intensity={2.5} 
          distance={course.size * 4} 
          decay={2} 
        />
      )}

      <mesh
        ref={meshRef}
        geometry={bodyGeometry}
        renderOrder={3}
        onClick={(e) => {
          e.stopPropagation()
          if (unlocked) onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHoverIn()
          if (unlocked) document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHoverOut()
          document.body.style.cursor = 'default'
        }}
      >
        <meshStandardMaterial
          ref={bodyMaterialRef}
          map={texture || null}
          color={texture ? "#ffffff" : (unlocked ? course.color : "#1a1a2e")}
          roughness={texture ? 0.9 : 0.8}
          metalness={texture ? 0.02 : 0.05}
          emissive={unlocked ? course.color : "#000000"}
          emissiveIntensity={unlocked ? 0.35 : 0.05}
          toneMapped={true}
        />
      </mesh>

      {cloudTexture && unlocked && (
        <CloudLayer cloudMap={cloudTexture} size={course.size} />
      )}

      {!unlocked && (
        <>
          <mesh scale={1.002} geometry={bodyGeometry} renderOrder={4}>
            <meshStandardMaterial
              color="#0a0a15"
              transparent
              opacity={hovered ? 0.7 : 0.85}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh scale={1.003} geometry={bodyGeometry} renderOrder={5}>
            <meshStandardMaterial 
              color="#1a1a33" 
              wireframe 
              transparent 
              opacity={0.03} 
              toneMapped={false} 
            />
          </mesh>
        </>
      )}
    </>
  )
}

// Planet rings removed entirely

function AtmosphereLayers({
  course,
  unlocked,
  unlockProgress,
}: {
  course: Course
  unlocked: boolean
  unlockProgress: number
}) {
  // Disabled atmosphere glow to show real planet textures
  return null
}

function PlanetLabels({ course, unlocked }: { course: Course; unlocked: boolean }) {
  if (unlocked) {
    return (
      <Html
        position={[0, course.size + 0.35, 0]}
        distanceFactor={8}
        occlude
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.75)',
            border: `1px solid ${course.color}99`,
            borderRadius: 20,
            padding: '2px 8px',
            color: course.color,
            fontSize: 9,
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
            boxShadow: `0 0 8px ${course.color}44`,
            pointerEvents: 'none',
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {course.name}
        </div>
      </Html>
    )
  }

  return (
    <Html position={[0, course.size + 0.35, 0]} distanceFactor={8} occlude style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(30,15,50,0.85)',
          border: '1px solid rgba(150,80,255,0.6)',
          borderRadius: '50%',
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          boxShadow: '0 0 14px rgba(120,60,220,0.5)',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      >
        🔒
      </div>
    </Html>
  )
}

export function Planet({
  course,
  unlocked,
  unlockProgress,
  onClick,
  isSelected,
  onHover,
}: PlanetProps) {
  const [hovered, setHovered] = useState(false)

  const { scale } = useSpring({
    scale: unlocked ? 1 : 0.82,
    config: { mass: 1, tension: 120, friction: 14, duration: 1200 },
  })

  return (
    <group position={course.position}>
      <AtmosphereLayers course={course} unlocked={unlocked} unlockProgress={unlockProgress} />

      <a.group scale={scale}>
        <PlanetMesh
          course={course}
          unlocked={unlocked}
          hovered={hovered}
          onClick={onClick}
          onHoverIn={() => {
            setHovered(true)
            onHover(course)
          }}
          onHoverOut={() => {
            setHovered(false)
            onHover(null)
          }}
        />
      </a.group>

      <PlanetLabels course={course} unlocked={unlocked} />
    </group>
  )
}
