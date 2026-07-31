import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from './runtime'
import { useGameStore } from '../stores/gameStore'
import { realityColor, realitySecondary, SPEED } from '../utils/constants'

const ORBITER_COUNT = 5

/**
 * Abstract digital falcon: a swept delta silhouette with a bright crystalline
 * core. Purely suggestive of a raptor in profile — no literal bird geometry.
 * Visual only; the collision box in constants.ts is unchanged.
 */
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
  const wingL = useRef<THREE.Group>(null)
  const wingR = useRef<THREE.Group>(null)

  const primary = realityColor(reality)
  const secondary = realitySecondary(reality)

  /** Swept-back wing: a long leading edge raked toward the tail. */
  const wingGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(1.55, -0.52)
    shape.lineTo(1.42, -0.84)
    shape.lineTo(0.72, -0.66)
    shape.lineTo(0.1, -0.3)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false })
  }, [])

  /** Narrow primary-feather slat that trails each wing. */
  const featherGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(0.62, -0.12)
    shape.lineTo(0.58, -0.2)
    shape.lineTo(0, -0.09)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false })
  }, [])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const r = runtime
    const t = state.clock.elapsedTime

    if (phase === 'menu' || phase === 'gameover' || phase === 'loading') {
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

    const pulse = 1 + r.shiftPulse * 0.35 + (r.overdrive ? 0.12 + Math.sin(t * 14) * 0.03 : 0)
    g.scale.setScalar(pulse)

    if (coreMat.current) {
      coreMat.current.emissiveIntensity = 2.4 + r.shiftPulse * 5 + (r.overdrive ? 2.6 : 0)
    }
    if (shieldMat.current && shield.current) {
      shieldMat.current.opacity = 0.035 + r.shiftPulse * 0.3 + (r.overdrive ? 0.12 : 0)
      shield.current.scale.setScalar(1 + Math.sin(t * 3.5) * 0.04)
    }
    if (light.current) {
      light.current.intensity = 3.4 + r.shiftPulse * 9 + (r.overdrive ? 5.5 : 0)
    }
    if (hull.current) {
      hull.current.rotation.z = Math.sin(t * 1.4) * 0.03
    }

    // Wings sweep back with speed and flare open during Overdrive.
    const inMenus = phase === 'menu' || phase === 'gameover' || phase === 'loading'
    const speedNorm = inMenus ? 0.15 : (r.speed - SPEED.base) / (SPEED.max - SPEED.base)
    const flare = (r.overdrive ? 0.34 : 0) + Math.sin(t * 2.1) * 0.02 - speedNorm * 0.12
    if (wingL.current) wingL.current.rotation.z = 0.1 + flare
    if (wingR.current) wingR.current.rotation.z = -0.1 - flare

    const trailLen = 2.4 + speedNorm * 5.4 + (r.overdrive ? 4.4 : 0) + r.shiftPulse * 2
    for (const ref of [trailL, trailR, trailC]) {
      const m = ref.current
      if (!m) continue
      const len = ref === trailC ? trailLen * 0.85 : trailLen
      m.scale.set(1, len, 1)
      m.position.z = (ref === trailC ? 0.95 : 0.55) + len / 2
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = 0.4 + speedNorm * 0.26 + (r.overdrive ? 0.26 : 0)
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
      {/* elongated crystalline core — the falcon's body/head line */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.34, 1.62, 0.34]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={coreMat}
          color="#04120d"
          emissive={primary}
          emissiveIntensity={2.4}
          metalness={0.9}
          roughness={0.15}
        />
      </mesh>
      {/* bright inner heart */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.15, 0.78, 0.15]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#F7F5EC" toneMapped={false} />
      </mesh>
      {/* forward beak taper */}
      <mesh position={[0, 0, -1.15]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.13, 0.42, 0.13]}>
        <coneGeometry args={[1, 2, 8]} />
        <meshStandardMaterial color="#04120d" emissive={secondary} emissiveIntensity={1.6} metalness={0.9} roughness={0.2} />
      </mesh>

      <group ref={hull}>
        {/* swept wings */}
        <group ref={wingR} position={[0.3, -0.04, 0.3]}>
          <mesh geometry={wingGeometry} rotation={[0.12, -0.3, 0]}>
            <meshStandardMaterial color="#07211a" emissive={secondary} emissiveIntensity={1.1} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh geometry={featherGeometry} position={[1.0, -0.6, 0.05]} rotation={[0.12, -0.3, -0.24]}>
            <meshBasicMaterial color={primary} transparent opacity={0.75} toneMapped={false} />
          </mesh>
        </group>
        <group ref={wingL} position={[-0.3, -0.04, 0.3]} scale={[-1, 1, 1]}>
          <mesh geometry={wingGeometry} rotation={[0.12, -0.3, 0]}>
            <meshStandardMaterial color="#07211a" emissive={secondary} emissiveIntensity={1.1} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh geometry={featherGeometry} position={[1.0, -0.6, 0.05]} rotation={[0.12, -0.3, -0.24]}>
            <meshBasicMaterial color={primary} transparent opacity={0.75} toneMapped={false} />
          </mesh>
        </group>

        {/* tail fin */}
        <mesh position={[0, 0.16, 0.82]} rotation={[0.42, 0, 0]} scale={[0.06, 0.42, 0.3]}>
          <boxGeometry />
          <meshStandardMaterial color="#07211a" emissive={primary} emissiveIntensity={0.9} metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* engine + wingtip light streaks */}
      <mesh ref={trailC} position={[0, 0, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.12, 1, 8]} />
        <meshBasicMaterial color={primary} transparent opacity={0.7} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={trailR} position={[1.45, -0.55, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 1, 6]} />
        <meshBasicMaterial color={primary} transparent opacity={0.4} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={trailL} position={[-1.45, -0.55, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.06, 1, 6]} />
        <meshBasicMaterial color={primary} transparent opacity={0.4} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* energy shield */}
      <mesh ref={shield}>
        <sphereGeometry args={[1.5, 24, 16]} />
        <meshBasicMaterial
          ref={shieldMat}
          color={primary}
          transparent
          opacity={0.035}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
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
          <meshBasicMaterial color={i % 2 ? secondary : '#F7F5EC'} toneMapped={false} />
        </mesh>
      ))}

      <pointLight ref={light} color={primary} intensity={3.4} distance={16} decay={2} />
    </group>
  )
}
