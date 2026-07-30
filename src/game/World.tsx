import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime } from './runtime'
import { COLORS } from '../utils/constants'
import { randRange } from '../utils/math'

const CYAN = new THREE.Color(COLORS.cyan.primary)
const MAGENTA = new THREE.Color(COLORS.magenta.primary)
const BG = new THREE.Color(COLORS.bgDeep)

const tmpObj = new THREE.Object3D()
const tmpColor = new THREE.Color()

/** Distance travelled since last frame — the world scrolls by this amount. */
function useWorldDelta() {
  const last = useRef(runtime.distance)
  return () => {
    const d = runtime.distance - last.current
    last.current = runtime.distance
    return d
  }
}

/** Scene fog + reality-tinted lighting. */
export function Atmosphere() {
  const scene = useThree((s) => s.scene)
  const key = useRef<THREE.PointLight>(null)
  const fill = useRef<THREE.PointLight>(null)

  useEffect(() => {
    scene.fog = new THREE.FogExp2(COLORS.bgDeep, 0.0105)
    scene.background = new THREE.Color(COLORS.bgDeep)
    return () => {
      scene.fog = null
      scene.background = null
    }
  }, [scene])

  useFrame((_, dt) => {
    const target = runtime.reality === 'cyan' ? CYAN : MAGENTA
    const k = 1 - Math.exp(-3.5 * dt)
    if (scene.fog instanceof THREE.FogExp2) {
      tmpColor.copy(BG).lerp(target, 0.1)
      scene.fog.color.lerp(tmpColor, k)
      if (scene.background instanceof THREE.Color) scene.background.copy(scene.fog.color).multiplyScalar(0.42)
    }
    if (key.current) key.current.color.lerp(target, k)
    if (fill.current) {
      tmpColor.copy(runtime.reality === 'cyan' ? MAGENTA : CYAN)
      fill.current.color.lerp(tmpColor, k)
    }
  })

  return (
    <>
      <ambientLight intensity={0.35} color="#4a5578" />
      <pointLight ref={key} position={[0, 12, -30]} intensity={280} distance={120} color={COLORS.cyan.primary} />
      <pointLight ref={fill} position={[0, 4, 14]} intensity={60} distance={60} color={COLORS.magenta.primary} />
      <hemisphereLight args={['#1a2245', '#03040B', 0.5]} />
    </>
  )
}

/** Scrolling neon floor + ceiling grid via a small shader. */
export function GridFloor() {
  const mat = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uScroll: { value: 0 },
      uColor: { value: new THREE.Color(COLORS.cyan.primary) },
      uFade: { value: new THREE.Color(COLORS.bgDeep) },
    }),
    [],
  )

  useFrame((_, dt) => {
    if (!mat.current) return
    mat.current.uniforms.uScroll.value = runtime.distance % 8
    const target = runtime.reality === 'cyan' ? CYAN : MAGENTA
    ;(mat.current.uniforms.uColor.value as THREE.Color).lerp(target, 1 - Math.exp(-3.5 * dt))
  })

  const shader = {
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uScroll;
      uniform vec3 uColor;
      uniform vec3 uFade;
      varying vec3 vPos;
      void main() {
        float z = vPos.y + uScroll; // plane rotated: local y runs along world z
        float lineZ = smoothstep(0.94, 1.0, abs(fract(z / 8.0) * 2.0 - 1.0));
        float lineX = smoothstep(0.93, 1.0, abs(fract(vPos.x / 6.0) * 2.0 - 1.0));
        float grid = max(lineZ, lineX);
        float dist = clamp(1.0 - (-vPos.y + 40.0) / 240.0, 0.0, 1.0);
        float glow = grid * dist;
        vec3 col = mix(uFade, uColor, glow * 0.85);
        gl_FragColor = vec4(col, 0.9);
      }
    `,
  }

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -80]}>
        <planeGeometry args={[90, 320, 1, 1]} />
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={shader.vertexShader} fragmentShader={shader.fragmentShader} transparent depthWrite={false} />
      </mesh>
    </>
  )
}

interface RecycledSpec {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  sz: number
  rotSpeed: number
  rot: number
}

function makeSpecs(count: number, gen: () => Omit<RecycledSpec, 'rot'>): RecycledSpec[] {
  return Array.from({ length: count }, () => ({ ...gen(), rot: Math.random() * Math.PI * 2 }))
}

/** Generic recycled instanced field that scrolls with the world and wraps. */
function useScrollingInstances(
  ref: React.RefObject<THREE.InstancedMesh | null>,
  specs: RecycledSpec[],
  span: number,
  spin = false,
) {
  const delta = useWorldDelta()
  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const d = delta()
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i]
      s.z += d
      if (s.z > 20) s.z -= span
      if (spin) s.rot += s.rotSpeed * dt
      tmpObj.position.set(s.x, s.y, s.z)
      tmpObj.rotation.set(spin ? s.rot : 0, s.rot * 0.7, spin ? s.rot * 0.5 : 0)
      tmpObj.scale.set(s.sx, s.sy, s.sz)
      tmpObj.updateMatrix()
      mesh.setMatrixAt(i, tmpObj.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
}

const TOWER_SPAN = 360
const TOWER_COUNT = 64

/** City towers flanking the corridor. */
export function Towers() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const strips = useRef<THREE.InstancedMesh>(null)

  const specs = useMemo(
    () =>
      makeSpecs(TOWER_COUNT, () => {
        const side = Math.random() < 0.5 ? -1 : 1
        const sx = randRange(2.5, 6)
        const sy = randRange(6, 26)
        return {
          x: side * randRange(13, 40),
          y: sy / 2 - randRange(0, 2),
          z: randRange(-TOWER_SPAN + 20, 20),
          sx,
          sy,
          sz: randRange(2.5, 6),
          rotSpeed: 0,
        }
      }),
    [],
  )

  const stripSpecs = useMemo(
    () =>
      specs.map((s) => ({
        ...s,
        x: s.x + (s.x > 0 ? -s.sx / 2 - 0.05 : s.sx / 2 + 0.05),
        sx: 0.12,
        sy: s.sy * randRange(0.5, 0.9),
        sz: 0.12,
        rot: 0,
      })),
    [specs],
  )

  useScrollingInstances(mesh, specs, TOWER_SPAN)
  useScrollingInstances(strips, stripSpecs, TOWER_SPAN)

  useEffect(() => {
    const m = strips.current
    if (!m) return
    for (let i = 0; i < stripSpecs.length; i++) {
      tmpColor.set(i % 2 === 0 ? COLORS.cyan.primary : COLORS.magenta.primary)
      m.setColorAt(i, tmpColor)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [stripSpecs])

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, TOWER_COUNT]} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#0a0e20" metalness={0.6} roughness={0.5} emissive="#11132A" emissiveIntensity={0.35} />
      </instancedMesh>
      <instancedMesh ref={strips} args={[undefined, undefined, TOWER_COUNT]} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  )
}

const FRAME_SPAN = 300
const FRAME_COUNT = 14

/** Architectural gate frames the corridor flies through. */
export function ArchFrames() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const specs = useMemo(
    () =>
      makeSpecs(FRAME_COUNT, () => ({
        x: 0,
        y: 4,
        z: randRange(-FRAME_SPAN + 20, 20),
        sx: randRange(16, 22),
        sy: randRange(12, 16),
        sz: 0.6,
        rotSpeed: randRange(-0.12, 0.12),
      })),
    [],
  )
  const delta = useWorldDelta()

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const d = delta()
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i]
      s.z += d
      if (s.z > 20) s.z -= FRAME_SPAN
      s.rot += s.rotSpeed * 0.016
      tmpObj.position.set(s.x, s.y, s.z)
      tmpObj.rotation.set(0, 0, s.rot)
      tmpObj.scale.set(s.sx, s.sy, s.sz)
      tmpObj.updateMatrix()
      m.setMatrixAt(i, tmpObj.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  const frameGeometry = useMemo(() => {
    // square ring built from a thin torus-like box outline via shape+holes
    const shape = new THREE.Shape()
    shape.moveTo(-0.5, -0.5)
    shape.lineTo(0.5, -0.5)
    shape.lineTo(0.5, 0.5)
    shape.lineTo(-0.5, 0.5)
    shape.closePath()
    const hole = new THREE.Path()
    hole.moveTo(-0.46, -0.46)
    hole.lineTo(0.46, -0.46)
    hole.lineTo(0.46, 0.46)
    hole.lineTo(-0.46, 0.46)
    hole.closePath()
    shape.holes.push(hole)
    return new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false })
  }, [])

  return (
    <instancedMesh ref={mesh} args={[frameGeometry, undefined, FRAME_COUNT]} frustumCulled={false}>
      <meshStandardMaterial color="#0c1128" emissive="#2a3466" emissiveIntensity={0.8} metalness={0.7} roughness={0.35} />
    </instancedMesh>
  )
}

const DEBRIS_SPAN = 260
const DEBRIS_COUNT = 80

/** Slow-tumbling floating debris shards. */
export function Debris() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const specs = useMemo(
    () =>
      makeSpecs(DEBRIS_COUNT, () => ({
        x: randRange(-26, 26),
        y: randRange(0.5, 18),
        z: randRange(-DEBRIS_SPAN + 20, 20),
        sx: randRange(0.12, 0.5),
        sy: randRange(0.12, 0.5),
        sz: randRange(0.12, 0.5),
        rotSpeed: randRange(0.2, 1.6),
      })),
    [],
  )
  useScrollingInstances(mesh, specs, DEBRIS_SPAN, true)

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, DEBRIS_COUNT]} frustumCulled={false}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#131936" emissive="#31407a" emissiveIntensity={0.6} metalness={0.8} roughness={0.3} />
    </instancedMesh>
  )
}

const STRIP_SPAN = 280
const STRIP_COUNT = 36

/** Neon light strips racing along the corridor edges. */
export function LightStrips() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const specs = useMemo(
    () =>
      makeSpecs(STRIP_COUNT, () => {
        const side = Math.random() < 0.5 ? -1 : 1
        return {
          x: side * randRange(7.6, 10),
          y: randRange(0.2, 7.5),
          z: randRange(-STRIP_SPAN + 20, 20),
          sx: 0.09,
          sy: 0.09,
          sz: randRange(3, 9),
          rotSpeed: 0,
        }
      }),
    [],
  )
  useScrollingInstances(mesh, specs, STRIP_SPAN)

  useEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < STRIP_COUNT; i++) {
      tmpColor.set(i % 3 === 0 ? COLORS.magenta.primary : COLORS.cyan.primary).multiplyScalar(0.8)
      m.setColorAt(i, tmpColor)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, STRIP_COUNT]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

const BEAM_COUNT = 8
const BEAM_SPAN = 300

/** Overhead energy cables crossing the canyon. */
export function EnergyBeams() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const specs = useMemo(
    () =>
      makeSpecs(BEAM_COUNT, () => ({
        x: randRange(-6, 6),
        y: randRange(9, 16),
        z: randRange(-BEAM_SPAN + 20, 20),
        sx: randRange(30, 60),
        sy: 0.07,
        sz: 0.07,
        rotSpeed: 0,
      })),
    [],
  )
  useScrollingInstances(mesh, specs, BEAM_SPAN)

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BEAM_COUNT]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial color="#5f7cff" toneMapped={false} transparent opacity={0.6} />
    </instancedMesh>
  )
}

const GLYPH_COUNT = 18
const GLYPH_SPAN = 300

/** Holographic abstract glyph panels floating beside the route. */
export function Glyphs() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const specs = useMemo(
    () =>
      makeSpecs(GLYPH_COUNT, () => {
        const side = Math.random() < 0.5 ? -1 : 1
        return {
          x: side * randRange(9, 16),
          y: randRange(2, 10),
          z: randRange(-GLYPH_SPAN + 20, 20),
          sx: randRange(0.8, 1.8),
          sy: randRange(0.8, 1.8),
          sz: 1,
          rotSpeed: randRange(0.3, 1),
        }
      }),
    [],
  )
  useScrollingInstances(mesh, specs, GLYPH_SPAN, true)

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, GLYPH_COUNT]} frustumCulled={false}>
      <ringGeometry args={[0.55, 0.8, 6]} />
      <meshBasicMaterial color="#38BDF8" toneMapped={false} transparent opacity={0.35} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

const STAR_COUNT = 700

/** Streaming data-particle starfield. */
export function DataField() {
  const points = useRef<THREE.Points>(null)
  const delta = useWorldDelta()

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const colors = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = randRange(-60, 60)
      positions[i * 3 + 1] = randRange(-4, 40)
      positions[i * 3 + 2] = randRange(-280, 20)
      const c = Math.random() < 0.5 ? CYAN : Math.random() < 0.5 ? MAGENTA : new THREE.Color('#8b9dff')
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [])

  useFrame(() => {
    const p = points.current
    if (!p) return
    const d = delta() * 0.6 // parallax: field moves slower than the corridor
    const pos = p.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < STAR_COUNT; i++) {
      let z = pos.getZ(i) + d
      if (z > 20) z -= 300
      pos.setZ(i, z)
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.14} vertexColors transparent opacity={0.8} sizeAttenuation depthWrite={false} />
    </points>
  )
}

const LINE_COUNT = 90

/** Speed lines: stretched segments that intensify with velocity/overdrive. */
export function SpeedLines() {
  const mesh = useRef<THREE.LineSegments>(null)
  const delta = useWorldDelta()

  const positions = useMemo(() => {
    const arr = new Float32Array(LINE_COUNT * 6)
    for (let i = 0; i < LINE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const rad = randRange(7, 16)
      const x = Math.cos(a) * rad
      const y = 4 + Math.sin(a) * rad * 0.7
      const z = randRange(-120, 10)
      arr[i * 6] = x
      arr[i * 6 + 1] = y
      arr[i * 6 + 2] = z
      arr[i * 6 + 3] = x
      arr[i * 6 + 4] = y
      arr[i * 6 + 5] = z - randRange(2, 5)
    }
    return arr
  }, [])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const d = delta() * 1.7
    const pos = m.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < LINE_COUNT; i++) {
      let z1 = pos.getZ(i * 2) + d
      let z2 = pos.getZ(i * 2 + 1) + d
      if (z1 > 14) {
        const shift = 134
        z1 -= shift
        z2 -= shift
      }
      pos.setZ(i * 2, z1)
      pos.setZ(i * 2 + 1, z2)
    }
    pos.needsUpdate = true
    const mat = m.material as THREE.LineBasicMaterial
    const speedNorm = Math.min(1, runtime.speed / 60)
    mat.opacity = 0.06 + speedNorm * 0.2 + (runtime.overdrive ? 0.25 : 0)
  })

  return (
    <lineSegments ref={mesh} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#9fd8ff" transparent opacity={0.1} depthWrite={false} />
    </lineSegments>
  )
}

/** Distant static skyline silhouettes for depth. */
export function Skyline() {
  const boxes = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1
        return {
          x: side * randRange(45, 90),
          h: randRange(20, 60),
          z: -randRange(80, 260),
          w: randRange(8, 18),
        }
      }),
    [],
  )
  return (
    <group>
      {boxes.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 4, b.z]}>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshBasicMaterial color="#05071a" />
        </mesh>
      ))}
    </group>
  )
}

export function World() {
  return (
    <group>
      <Atmosphere />
      <GridFloor />
      <Towers />
      <ArchFrames />
      <Debris />
      <LightStrips />
      <EnergyBeams />
      <Glyphs />
      <DataField />
      <SpeedLines />
      <Skyline />
    </group>
  )
}
