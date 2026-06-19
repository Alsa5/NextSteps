import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import BioluminescentGrove from './scenes/BioluminescentGrove'
import NebulaCity from './scenes/NebulaCity'
import GrowthTree from './scenes/GrowthTree'
import AudioPulseSphere from './scenes/AudioPulseSphere'
import { ROLE_SCENE } from '../../theme/maverickNebula'
import './metaverse.css'

function SceneContent({ variant }) {
  const v = variant || 'grove'
  if (v === 'city' || v === 'horizon') {
    return (
      <>
        <NebulaCity />
        <Stars radius={80} depth={40} count={3000} factor={3} fade speed={0.5} />
      </>
    )
  }
  if (v === 'growth') return <GrowthTree />
  if (v === 'pulse') {
    return (
      <>
        <AudioPulseSphere />
        <pointLight position={[0, 0, 0]} intensity={1.5} color="#f7c948" />
      </>
    )
  }
  return (
    <>
      <BioluminescentGrove />
      <Stars radius={60} depth={30} count={2000} factor={2} fade speed={0.4} />
    </>
  )
}

export default function MetaverseBackdrop({
  variant,
  role,
  className = '',
  interactive = false,
  cameraPosition = [0, 2, 12],
}) {
  const sceneVariant = variant || ROLE_SCENE[role] || 'grove'

  return (
    <div className={`metaverse-backdrop ${className}`} aria-hidden>
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#0a0818']} />
        <ambientLight intensity={0.4} />
        <Suspense fallback={null}>
          <SceneContent variant={sceneVariant} />
          {interactive && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.35}
              maxPolarAngle={Math.PI / 2.1}
              minPolarAngle={Math.PI / 4}
            />
          )}
        </Suspense>
      </Canvas>
      <div className="metaverse-backdrop-vignette" />
    </div>
  )
}
