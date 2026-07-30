import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from './runtime'
import { COLORS } from '../utils/constants'
import type { ObstacleInstance } from '../types'

const BOX_SLOTS = 64
const RING_SLOTS = 6

const CYAN = new THREE.Color(COLORS.cyan.primary)
const MAGENTA = new THREE.Color(COLORS.magenta.primary)

interface Slot {
  mesh: THREE.Mesh
  mat: THREE.MeshStandardMaterial
}

function styleSlot(slot: Slot, o: ObstacleInstance, t: number) {
  const dangerous = o.reality === runtime.reality
  const color = o.reality === 'cyan' ? CYAN : MAGENTA
  slot.mat.emissive.copy(color)
  slot.mat.color.copy(color).multiplyScalar(dangerous ? 0.22 : 0.08)
  if (dangerous) {
    slot.mat.opacity = 0.96
    slot.mat.emissiveIntensity = 1.5 + Math.sin(t * 5 + o.id) * 0.2
    slot.mat.wireframe = false
  } else {
    // ghost state: barely-there hologram with a slow distortion flicker
    slot.mat.opacity = 0.13 + Math.sin(t * 7 + o.id * 1.7) * 0.04
    slot.mat.emissiveIntensity = 0.55
    slot.mat.wireframe = true
  }
  // overdrive makes everything phase-transparent to sell invulnerability
  if (runtime.overdrive && dangerous) {
    slot.mat.opacity = 0.4
  }
}

export function ObstacleField() {
  const boxRefs = useRef<(THREE.Mesh | null)[]>([])
  const ringRefs = useRef<(THREE.Mesh | null)[]>([])

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(2, 2, 2), [])
  const ringGeometry = useMemo(() => new THREE.TorusGeometry(1, 0.16, 10, 40), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    let boxI = 0
    let ringI = 0

    for (const o of runtime.obstacles) {
      if (o.shape === 'ring') {
        const mesh = ringRefs.current[ringI++]
        if (!mesh) continue
        mesh.visible = true
        mesh.position.set(o.x, o.y, o.z)
        mesh.scale.set(o.ringR, o.ringR, 1)
        mesh.rotation.z = o.rot
        styleSlot({ mesh, mat: mesh.material as THREE.MeshStandardMaterial }, o, t)
      } else {
        const mesh = boxRefs.current[boxI++]
        if (!mesh) continue
        mesh.visible = true
        mesh.position.set(o.x, o.y, o.z)
        mesh.scale.set(o.w, o.h, o.d)
        mesh.rotation.z = o.rot
        styleSlot({ mesh, mat: mesh.material as THREE.MeshStandardMaterial }, o, t)
      }
      if (boxI >= BOX_SLOTS && ringI >= RING_SLOTS) break
    }

    for (let i = boxI; i < BOX_SLOTS; i++) {
      const m = boxRefs.current[i]
      if (m) m.visible = false
    }
    for (let i = ringI; i < RING_SLOTS; i++) {
      const m = ringRefs.current[i]
      if (m) m.visible = false
    }
  })

  return (
    <group>
      {Array.from({ length: BOX_SLOTS }, (_, i) => (
        <mesh
          key={`b${i}`}
          ref={(el) => {
            boxRefs.current[i] = el
          }}
          geometry={boxGeometry}
          visible={false}
        >
          <meshStandardMaterial transparent metalness={0.55} roughness={0.3} depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: RING_SLOTS }, (_, i) => (
        <mesh
          key={`r${i}`}
          ref={(el) => {
            ringRefs.current[i] = el
          }}
          geometry={ringGeometry}
          visible={false}
        >
          <meshStandardMaterial transparent metalness={0.55} roughness={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
