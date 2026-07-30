import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import type { ChromaticAberrationEffect, BloomEffect } from 'postprocessing'
import { runtime } from './runtime'
import { COLORS, realityColor } from '../utils/constants'
import { useGameStore } from '../stores/gameStore'

const SHOCKWAVE_SLOTS = 5

/** Expanding rings emitted on shift / overdrive / impact. */
export function Shockwaves() {
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const reality = useGameStore((s) => s.reality)

  useFrame(() => {
    for (let i = 0; i < SHOCKWAVE_SLOTS; i++) {
      const mesh = refs.current[i]
      if (!mesh) continue
      const wave = runtime.shockwaves[i]
      if (!wave) {
        mesh.visible = false
        continue
      }
      mesh.visible = true
      const p = wave.t / 1.2
      const scale = 0.4 + p * 26 * wave.strength
      mesh.position.set(wave.x, wave.y, 0)
      mesh.scale.setScalar(scale)
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - p) * 0.55 * wave.strength
    }
  })

  return (
    <group>
      {Array.from({ length: SHOCKWAVE_SLOTS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          visible={false}
        >
          <ringGeometry args={[0.92, 1, 48]} />
          <meshBasicMaterial color={realityColor(reality)} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

const FRAGMENT_COUNT = 42

/** Fracture explosion played when the glider is destroyed. */
export function Explosion() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const flash = useRef<THREE.PointLight>(null)
  const tmp = useMemo(() => new THREE.Object3D(), [])

  const velocities = useMemo(() => {
    const v: THREE.Vector3[] = []
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const b = Math.random() * Math.PI - Math.PI / 2
      const speed = 3 + Math.random() * 12
      v.push(new THREE.Vector3(Math.cos(a) * Math.cos(b) * speed, Math.sin(b) * speed, Math.sin(a) * Math.cos(b) * speed))
    }
    return v
  }, [])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const t = runtime.explosionT
    const active = runtime.status === 'dying' && t > 0
    m.visible = active
    if (flash.current) {
      flash.current.intensity = active ? Math.max(0, 1 - t * 1.6) * 60 : 0
      flash.current.position.set(runtime.explosionX, runtime.explosionY, 0)
    }
    if (!active) return
    for (let i = 0; i < FRAGMENT_COUNT; i++) {
      const v = velocities[i]
      tmp.position.set(
        runtime.explosionX + v.x * t,
        runtime.explosionY + v.y * t - 4 * t * t,
        v.z * t,
      )
      tmp.rotation.set(t * (i % 5), t * (i % 3), t * 2)
      const s = Math.max(0.001, 0.22 * (1 - t / 1.4))
      tmp.scale.setScalar(s)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, FRAGMENT_COUNT]} visible={false} frustumCulled={false}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={COLORS.highlight} toneMapped={false} />
      </instancedMesh>
      <pointLight ref={flash} color="#ffffff" intensity={0} distance={40} decay={2} />
    </group>
  )
}

/** Post-processing stack. Refs are driven per-frame from the runtime. */
export function PostFX() {
  const quality = useGameStore((s) => s.settings.quality)
  const chromaRef = useRef<ChromaticAberrationEffect>(null)
  const bloomRef = useRef<BloomEffect>(null)
  const offset = useMemo(() => new THREE.Vector2(0.0004, 0.0004), [])
  // the library's JSX typings expect the class type for refs; cast instance refs
  const bloomRefProp = bloomRef as unknown as React.Ref<typeof BloomEffect>
  const chromaRefProp = chromaRef as unknown as React.Ref<typeof ChromaticAberrationEffect>

  useFrame(() => {
    const c = runtime.chroma
    const base = 0.00045
    const amount = base + c * 0.004
    if (chromaRef.current) {
      chromaRef.current.offset.set(amount, amount * 0.6)
    }
    if (bloomRef.current) {
      bloomRef.current.intensity = (runtime.overdrive ? 1.55 : 1.0) + runtime.shiftPulse * 0.6 + runtime.flash * 0.4
    }
  })

  if (quality === 'low') return null

  if (quality === 'medium') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom ref={bloomRefProp} intensity={1.0} luminanceThreshold={0.22} luminanceSmoothing={0.4} mipmapBlur radius={0.72} />
        <Vignette eskil={false} offset={0.18} darkness={0.86} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={bloomRefProp} intensity={1.0} luminanceThreshold={0.22} luminanceSmoothing={0.4} mipmapBlur radius={0.72} />
      <ChromaticAberration ref={chromaRefProp} offset={offset} radialModulation={false} modulationOffset={0} />
      <Noise opacity={0.055} />
      <Vignette eskil={false} offset={0.18} darkness={0.86} />
    </EffectComposer>
  )
}
