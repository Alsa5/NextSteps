import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function HolographicMaterial({ 
  fresnelAmount = 0.4,
  fresnelOpacity = 0.8, 
  scanlineSize = 8,
  holographicColor = "#88ccff",
  ...props 
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFresnelAmount: { value: fresnelAmount },
    uFresnelOpacity: { value: fresnelOpacity },
    uScanlineSize: { value: scanlineSize },
    uHolographicColor: { value: new THREE.Color(holographicColor) },
  }), [fresnelAmount, fresnelOpacity, scanlineSize, holographicColor])

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewDirection;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      
      gl_Position = projectedPosition;
      
      vNormal = normalize(normalMatrix * normal);
      vViewDirection = normalize(modelPosition.xyz - cameraPosition);
    }
  `

  const fragmentShader = `
    uniform float uTime;
    uniform float uFresnelAmount;
    uniform float uFresnelOpacity;
    uniform float uScanlineSize;
    uniform vec3 uHolographicColor;
    
    varying vec3 vNormal;
    varying vec3 vViewDirection;
    varying vec2 vUv;
    
    void main() {
      // Fresnel effect
      float fresnel = dot(vViewDirection, vNormal);
      fresnel = pow(1.0 - abs(fresnel), uFresnelAmount);
      
      // Scanlines
      float scanlines = sin(vUv.y * uScanlineSize + uTime * 2.0) * 0.5 + 0.5;
      scanlines = pow(scanlines, 3.0);
      
      // Holographic interference
      float interference = sin(vUv.x * 50.0 + uTime * 3.0) * sin(vUv.y * 30.0 + uTime * 2.5);
      interference = interference * 0.1 + 0.9;
      
      vec3 color = uHolographicColor * (fresnel + 0.2);
      color *= scanlines * interference;
      
      float alpha = (fresnel * uFresnelOpacity + 0.1) * scanlines;
      
      gl_FragColor = vec4(color, alpha);
    }
  `

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent
      side={THREE.DoubleSide}
      {...props}
    />
  )
}