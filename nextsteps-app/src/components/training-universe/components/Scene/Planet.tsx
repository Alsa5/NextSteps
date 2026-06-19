import { useMemo, useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { a, useSpring } from '@react-spring/three'
import * as THREE from 'three'
import type { TrainingStage } from '../../data/trainingStages'

function useSafeTexture(url: string | undefined): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!url) return

    const loader = new THREE.TextureLoader()
    let active = true
    loader.load(
      url,
      (tex) => {
        if (!active) return
        tex.colorSpace = THREE.SRGBColorSpace
        setTexture(tex)
      },
      undefined,
      () => {
        if (active) setTexture(null)
      },
    )

    return () => {
      active = false
    }
  }, [url])

  return texture
}

interface PlanetProps {
  stage: TrainingStage
  planetIndex: number
  unlocked: boolean
  unlockProgress: number
  onClick: () => void
  isSelected: boolean
  onHover: (stage: TrainingStage | null, index?: number) => void
}

function CloudLayer({ cloudMap, size }: { cloudMap: THREE.Texture; size: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => new THREE.SphereGeometry(size, 32, 32), [size])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.0008
  })

  return (
    <mesh ref={ref} scale={1.02} geometry={geometry} renderOrder={6}>
      <meshStandardMaterial map={cloudMap} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

interface PlanetMeshProps {
  stage: TrainingStage
  unlocked: boolean
  hovered: boolean
  onClick: () => void
  onHoverIn: () => void
  onHoverOut: () => void
}

function PlanetMesh({ stage, unlocked, hovered, onClick, onHoverIn, onHoverOut }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  const lockLightRef = useRef<THREE.PointLight>(null)
  const bodyGeometry = useMemo(() => new THREE.SphereGeometry(stage.size, 64, 64), [stage.size])

  const texture = useSafeTexture(stage.texture)
  const cloudTexture = useSafeTexture(stage.cloudTexture)

  useEffect(() => {
    if (texture && bodyMaterialRef.current) {
      bodyMaterialRef.current.map = texture
      bodyMaterialRef.current.color.set('#ffffff')
      bodyMaterialRef.current.needsUpdate = true
    }
  }, [texture])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) meshRef.current.rotation.y = t * stage.rotationSpeed * 60
    if (bodyMaterialRef.current && unlocked) {
      bodyMaterialRef.current.emissiveIntensity = 0.6 + Math.sin(t * 1.5 + stage.id) * 0.2
    }
    if (lockLightRef.current && !unlocked) {
      lockLightRef.current.intensity = 0.3 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.4
    }
  })

  return (
    <>
      {!unlocked && (
        <pointLight ref={lockLightRef} color="#6644aa" intensity={0.15} distance={stage.size * 3} decay={2} />
      )}
      {unlocked && (
        <pointLight color={stage.color} intensity={2.5} distance={stage.size * 4} decay={2} />
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
          color={texture ? '#ffffff' : unlocked ? stage.color : '#1a1a2e'}
          roughness={texture ? 0.9 : 0.8}
          metalness={texture ? 0.02 : 0.05}
          emissive={unlocked ? stage.color : '#000000'}
          emissiveIntensity={unlocked ? 0.35 : 0.05}
          toneMapped
        />
      </mesh>

      {cloudTexture && unlocked && <CloudLayer cloudMap={cloudTexture} size={stage.size} />}

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
            <meshStandardMaterial color="#1a1a33" wireframe transparent opacity={0.03} toneMapped={false} />
          </mesh>
        </>
      )}
    </>
  )
}

function PlanetLabels({
  stage,
  unlocked,
  hideLabel,
}: {
  stage: TrainingStage
  unlocked: boolean
  hideLabel?: boolean
}) {
  if (hideLabel) return null

  if (unlocked) {
    return (
      <Html position={[0, stage.size + 0.35, 0]} distanceFactor={8} occlude style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(0,0,0,0.75)',
            border: `1px solid ${stage.color}99`,
            borderRadius: 20,
            padding: '2px 8px',
            color: stage.color,
            fontSize: 9,
            fontFamily: 'var(--font-app)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
            boxShadow: `0 0 8px ${stage.color}44`,
            pointerEvents: 'none',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {stage.name}
        </div>
      </Html>
    )
  }

  return (
    <Html
      position={[0, stage.size + 0.35, 0]}
      distanceFactor={8}
      occlude={false}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
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

export function Planet({ stage, planetIndex, unlocked, onClick, onHover, isSelected }: PlanetProps) {
  const [hovered, setHovered] = useState(false)

  const { scale } = useSpring({
    scale: unlocked ? 1 : 0.82,
    config: { mass: 1, tension: 120, friction: 14, duration: 1200 },
  })

  return (
    <group position={stage.position}>
      <a.group scale={scale}>
        <PlanetMesh
          stage={stage}
          unlocked={unlocked}
          hovered={hovered}
          onClick={onClick}
          onHoverIn={() => {
            setHovered(true)
            onHover(stage, planetIndex)
          }}
          onHoverOut={() => {
            setHovered(false)
            onHover(null)
          }}
        />
      </a.group>
      <PlanetLabels stage={stage} unlocked={unlocked} hideLabel={isSelected} />
    </group>
  )
}
