import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from './runtime'
import { COLORS } from '../utils/constants'

const SHARD_SLOTS = 32
const tmpObj = new THREE.Object3D()

/** Instanced glowing quantum shards with a gentle bob + spin. */
export function ShardField() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const halo = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const m = mesh.current
    const h = halo.current
    if (!m || !h) return
    const t = state.clock.elapsedTime
    const count = Math.min(runtime.shards.length, SHARD_SLOTS)
    for (let i = 0; i < count; i++) {
      const s = runtime.shards[i]
      const bob = Math.sin(t * 2 + s.spin * 3) * 0.15
      tmpObj.position.set(s.x, s.y + bob, s.z)
      tmpObj.rotation.set(0, s.spin, s.spin * 0.5)
      tmpObj.scale.setScalar(0.34)
      tmpObj.updateMatrix()
      m.setMatrixAt(i, tmpObj.matrix)
      tmpObj.scale.setScalar(0.62 + Math.sin(t * 3 + s.spin) * 0.08)
      tmpObj.updateMatrix()
      h.setMatrixAt(i, tmpObj.matrix)
    }
    for (let i = count; i < SHARD_SLOTS; i++) {
      tmpObj.position.set(0, -100, 0)
      tmpObj.scale.setScalar(0.0001)
      tmpObj.updateMatrix()
      m.setMatrixAt(i, tmpObj.matrix)
      h.setMatrixAt(i, tmpObj.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    h.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, SHARD_SLOTS]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={COLORS.highlight} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={halo} args={[undefined, undefined, SHARD_SLOTS]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#FFD98A" transparent opacity={0.32} toneMapped={false} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
