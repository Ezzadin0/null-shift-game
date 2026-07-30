import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from './runtime'
import { useGameStore } from '../stores/gameStore'
import { realityColor, realitySecondary, SPEED } from '../utils/constants'

const ORBITER_COUNT = 5

export function Player() {
  const reality = useGameStore((s) => s.reality)
  const phase = useGameStore((s) => s.phase)

  const group = useRef<THREE.Group>(null)
  const hull = useRef<THREE.Group>(null)
  const coreMat = useRef<THREE.MeshStandardMaterial>(null)
  const shieldMat = useRef<THREE.MeshBasicMaterial>(null)
  const shield = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const orbiters = useRef<THREE.Mesh[]>([])
  const trailL = useRef<THREE.Mesh>(null)
  const trailR = useRef<THREE.Mesh>(null)
  const trailC = useRef<THREE.Mesh>(null)

  const primary = realityColor(reality)
  const secondary = realitySecondary(reality)

  const finGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.35, -0.28)
    shape.lineTo(1.05, -0.62)
    shape.lineTo(0.12, -0.34)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false })
  }, [])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const r = runtime
    const t = state.clock.elapsedTime

    if (phase === 'menu' || phase === 'gameover' || phase === 'loading') {
      // idle showcase float in menus
      g.position.set(0, 2.1 + Math.sin(t * 1.1) * 0.18, 0)
      g.rotation.set(Math.sin(t * 0.7) * 0.06, Math.sin(t * 0.4) * 0.25, Math.sin(t * 0.9) * 0.08)
      g.visible = true
    } else {
      const dying = r.status === 'dying'
      g.visible = !dying || r.explosionT < 0.06
      g.position.set(r.px, r.py + Math.sin(t * 2.2) * 0.05, 0)
      g.rotation.z = r.bank
      g.rotation.x = -r.vy * 0.014
      g.rotation.y = -r.vx * 0.02
    }

    // shift pulse + overdrive scale-up
    const pulse = 1 + r.shiftPulse * 0.35 + (r.overdrive ? 0.12 + Math.sin(t * 14) * 0.03 : 0)
    g.scale.setScalar(pulse)

    if (coreMat.current) {
      coreMat.current.emissiveIntensity = 2.2 + r.shiftPulse * 5 + (r.overdrive ? 2.4 : 0)
    }
    if (shieldMat.current && shield.current) {
      shieldMat.current.opacity = 0.03 + r.shiftPulse * 0.28 + (r.overdrive ? 0.1 : 0)
      shield.current.scale.setScalar(1 + Math.sin(t * 3.5) * 0.04)
    }
    if (light.current) {
      light.current.intensity = 3 + r.shiftPulse * 9 + (r.overdrive ? 5 : 0)
    }
    if (hull.current) {
      hull.current.rotation.z = Math.sin(t * 1.4) * 0.03
    }
    // fin light-streak trails stretch with speed and overdrive
    const inMenus = phase === 'menu' || phase === 'gameover' || phase === 'loading'
    const speedNorm = inMenus ? 0.15 : (r.speed - SPEED.base) / (SPEED.max - SPEED.base)
    const trailLen = 2.2 + speedNorm * 5 + (r.overdrive ? 4 : 0) + r.shiftPulse * 2
    for (const ref of [trailL, trailR, trailC]) {
      const m = ref.current
      if (!m) continue
      const len = ref === trailC ? trailLen * 0.8 : trailLen
      m.scale.set(1, len, 1)
      m.position.z = (ref === trailC ? 0.9 : 0.5) + len / 2
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = 0.38 + speedNorm * 0.25 + (r.overdrive ? 0.25 : 0)
    }
    for (let i = 0; i < orbiters.current.length; i++) {
      const m = orbiters.current[i]
      if (!m) continue
      const a = t * (1.6 + i * 0.23) + (i * Math.PI * 2) / ORBITER_COUNT
      const rad = 1.15 + Math.sin(t * 2 + i) * 0.12
      m.position.set(Math.cos(a) * rad, Math.sin(a * 1.3) * 0.5, Math.sin(a) * rad * 0.7)
    }
  })

  return (
    <group ref={group} position={[0, 2, 0]}>
      {/* central crystal core */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.42, 1.5, 0.42]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#0a0f1e"
          emissive={primary}
          emissiveIntensity={2.2}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* inner white heart */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.18, 0.7, 0.18]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#F8FAFC" toneMapped={false} />
      </mesh>

      {/* floating fins */}
      <group ref={hull}>
        <mesh geometry={finGeometry} position={[0.35, -0.05, 0.35]} rotation={[0.15, -0.35, -0.1]}>
          <meshStandardMaterial color="#0d1226" emissive={secondary} emissiveIntensity={0.9} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh geometry={finGeometry} position={[-0.35, -0.05, 0.35]} rotation={[0.15, 0.35 + Math.PI, 0.1]} scale={[1, 1, 1]}>
          <meshStandardMaterial color="#0d1226" emissive={secondary} emissiveIntensity={0.9} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh ref={trailR} position={[1.3, -0.4, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 1, 6]} />
          <meshBasicMaterial color={primary} transparent opacity={0.4} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh ref={trailL} position={[-1.3, -0.4, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.07, 1, 6]} />
          <meshBasicMaterial color={primary} transparent opacity={0.4} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* engine glow streak */}
      <mesh ref={trailC} position={[0, 0, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.13, 1, 8]} />
        <meshBasicMaterial color={primary} transparent opacity={0.7} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* energy shield */}
      <mesh ref={shield}>
        <sphereGeometry args={[1.5, 24, 16]} />
        <meshBasicMaterial ref={shieldMat} color={primary} transparent opacity={0.03} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* orbiting particles */}
      {Array.from({ length: ORBITER_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) orbiters.current[i] = el
          }}
          scale={0.055}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={i % 2 ? secondary : '#F8FAFC'} toneMapped={false} />
        </mesh>
      ))}

      <pointLight ref={light} color={primary} intensity={3} distance={16} decay={2} />
    </group>
  )
}
