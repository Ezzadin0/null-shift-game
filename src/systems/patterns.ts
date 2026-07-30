import type { ObstacleInstance, Reality, ShardInstance } from '../types'
import { BOUNDS, WORLD } from '../utils/constants'
import { runtime } from '../game/runtime'
import { pick, randRange } from '../utils/math'

const otherReality = (r: Reality): Reality => (r === 'cyan' ? 'magenta' : 'cyan')
const randomReality = (): Reality => (Math.random() < 0.5 ? 'cyan' : 'magenta')

function makeObstacle(partial: Partial<ObstacleInstance> & Pick<ObstacleInstance, 'x' | 'y' | 'z' | 'reality'>): ObstacleInstance {
  return {
    id: runtime.idCounter++,
    shape: 'box',
    w: 1,
    h: 1,
    d: 0.6,
    rot: 0,
    rotSpeed: 0,
    oscAmpX: 0,
    oscAmpY: 0,
    oscFreq: 0,
    oscPhase: 0,
    ringR: 0,
    ringGrow: 0,
    closest: Infinity,
    passed: false,
    rewarded: false,
    ...partial,
    baseX: partial.x,
    baseY: partial.y,
  }
}

function addShard(x: number, y: number, z: number) {
  runtime.shards.push({ id: runtime.idCounter++, x, y, z, collected: false, spin: Math.random() * Math.PI * 2 })
}

function shardLine(z: number, x: number, y: number, count = 4, dz = -5) {
  for (let i = 0; i < count; i++) addShard(x, y, z + i * dz)
}

/**
 * Every pattern receives the spawn z (far ahead, negative) and a 0..1
 * difficulty value, appends obstacles/shards to the runtime, and returns the
 * distance the corridor stays occupied so the spawner can leave a fair gap.
 */
type Pattern = (z: number, diff: number) => number

/** 1. Reality gate: a full frame in one reality with a wide safe opening. */
const realityGate: Pattern = (z, diff) => {
  const r = randomReality()
  const gapX = randRange(-3, 3)
  const gapW = 3.4 - diff * 1.1
  const H = BOUNDS.yMax + 1.5
  const o = runtime.obstacles
  o.push(makeObstacle({ reality: r, x: gapX - gapW / 2 - 5, y: H / 2, z, w: 5, h: H / 2, d: 0.5 }))
  o.push(makeObstacle({ reality: r, x: gapX + gapW / 2 + 5, y: H / 2, z, w: 5, h: H / 2, d: 0.5 }))
  shardLine(z + 3, gapX, 2.4, 3)
  return 14
}

/** 2. Rotating bar: long bar spinning around the corridor center. */
const rotatingBar: Pattern = (z, diff) => {
  const r = randomReality()
  runtime.obstacles.push(
    makeObstacle({
      reality: r,
      shape: 'bar',
      x: 0,
      y: 3.4,
      z,
      w: 6.5,
      h: 0.45,
      d: 0.5,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (0.9 + diff * 1.4),
    }),
  )
  shardLine(z + 4, randRange(-3, 3), randRange(1.5, 4), 3)
  return 12
}

/** 3. Split wall: two solid halves in one reality with a vertical slot. */
const splitWall: Pattern = (z, diff) => {
  const r = randomReality()
  const gapY = randRange(1.6, 5)
  const gapH = 2.6 - diff * 0.8
  const o = runtime.obstacles
  o.push(makeObstacle({ reality: r, x: 0, y: gapY - gapH / 2 - 4, z, w: BOUNDS.x + 1.5, h: 4, d: 0.5 }))
  o.push(makeObstacle({ reality: r, x: 0, y: gapY + gapH / 2 + 4, z, w: BOUNDS.x + 1.5, h: 4, d: 0.5 }))
  shardLine(z + 3, 0, gapY, 3)
  return 13
}

/** 4. Moving pillars: vertical columns sweeping sideways. */
const movingPillars: Pattern = (z, diff) => {
  const count = 2 + Math.round(diff * 2)
  for (let i = 0; i < count; i++) {
    const r = randomReality()
    runtime.obstacles.push(
      makeObstacle({
        reality: r,
        x: randRange(-4, 4),
        y: 3.5,
        z: z - i * 14,
        w: 0.7,
        h: 4.2,
        d: 0.7,
        oscAmpX: randRange(1.6, 3.2),
        oscFreq: 0.6 + diff * 0.9,
        oscPhase: Math.random() * Math.PI * 2,
      }),
    )
  }
  addShard(randRange(-3, 3), randRange(1.5, 4.5), z - 6)
  return count * 14 + 6
}

/** 5. Laser grid: thin crossing beams, alternating realities. */
const laserGrid: Pattern = (z, diff) => {
  const r = randomReality()
  const rows = 2 + Math.round(diff)
  for (let i = 0; i < rows; i++) {
    const y = 1.2 + i * (5.2 / Math.max(1, rows - 1))
    runtime.obstacles.push(
      makeObstacle({
        reality: i % 2 === 0 ? r : otherReality(r),
        x: 0,
        y,
        z: z - i * 3,
        w: BOUNDS.x + 1.5,
        h: 0.16,
        d: 0.16,
      }),
    )
  }
  shardLine(z + 4, randRange(-2.5, 2.5), 3, 2)
  return rows * 3 + 12
}

/** 6. Expanding ring: torus pulsing outward — fly through the middle or phase. */
const expandingRing: Pattern = (z, diff) => {
  const r = randomReality()
  runtime.obstacles.push(
    makeObstacle({
      reality: r,
      shape: 'ring',
      x: randRange(-1.5, 1.5),
      y: 3.2,
      z,
      w: 0,
      h: 0.35,
      d: 0.4,
      ringR: 1.2,
      ringGrow: 0.9 + diff * 1.1,
    }),
  )
  addShard(randRange(-1, 1) + 0, 3.2, z + 5)
  return 12
}

/** 7. Alternating tunnel: sequence of frames flipping reality each segment. */
const alternatingTunnel: Pattern = (z, diff) => {
  const segments = 4 + Math.round(diff * 3)
  let r = randomReality()
  const spacing = 13 - diff * 3
  for (let i = 0; i < segments; i++) {
    const zz = z - i * spacing
    const H = BOUNDS.yMax + 1.5
    runtime.obstacles.push(makeObstacle({ reality: r, x: -BOUNDS.x - 2.2, y: H / 2, z: zz, w: 2.6, h: H / 2, d: 0.5 }))
    runtime.obstacles.push(makeObstacle({ reality: r, x: BOUNDS.x + 2.2, y: H / 2, z: zz, w: 2.6, h: H / 2, d: 0.5 }))
    runtime.obstacles.push(makeObstacle({ reality: r, x: 0, y: BOUNDS.yMax + 1.6, z: zz, w: BOUNDS.x + 4.8, h: 0.5, d: 0.5 }))
    runtime.obstacles.push(makeObstacle({ reality: r, x: 0, y: 3.4, z: zz, w: BOUNDS.x - 1.4, h: 0.35, d: 0.4 }))
    if (i % 2 === 1) addShard(0, 3.2, zz + spacing / 2)
    r = otherReality(r)
  }
  return segments * spacing + 8
}

/** 8. Narrow passage: two close slabs forming a tight near-miss slot. */
const narrowPassage: Pattern = (z, diff) => {
  const r = randomReality()
  const gapX = randRange(-2.5, 2.5)
  const gapW = 2.0 - diff * 0.5
  const o = runtime.obstacles
  o.push(makeObstacle({ reality: r, x: gapX - gapW / 2 - 3.5, y: 3.4, z, w: 3.5, h: 3.4, d: 1.2 }))
  o.push(makeObstacle({ reality: r, x: gapX + gapW / 2 + 3.5, y: 3.4, z, w: 3.5, h: 3.4, d: 1.2 }))
  shardLine(z + 2, gapX, 3, 3, -4)
  return 14
}

/** 9. Moving cluster: drifting group of small blocks. */
const movingCluster: Pattern = (z, diff) => {
  const count = 4 + Math.round(diff * 4)
  for (let i = 0; i < count; i++) {
    runtime.obstacles.push(
      makeObstacle({
        reality: randomReality(),
        x: randRange(-4.5, 4.5),
        y: randRange(1.2, 5.6),
        z: z - randRange(0, 26),
        w: randRange(0.5, 0.9),
        h: randRange(0.5, 0.9),
        d: randRange(0.5, 0.9),
        oscAmpX: randRange(0.4, 1.4),
        oscAmpY: randRange(0.3, 1),
        oscFreq: randRange(0.5, 1.1) + diff * 0.5,
        oscPhase: Math.random() * Math.PI * 2,
        rotSpeed: randRange(-1.2, 1.2),
      }),
    )
  }
  addShard(0, 3, z - 12)
  return 34
}

/** 10. Reality collapse: dense alternating full walls — the periodic set piece. */
export const realityCollapse: Pattern = (z, diff) => {
  const walls = 6 + Math.round(diff * 3)
  let r = randomReality()
  const spacing = 17 - diff * 4
  for (let i = 0; i < walls; i++) {
    const zz = z - i * spacing
    runtime.obstacles.push(
      makeObstacle({ reality: r, x: 0, y: 3.5, z: zz, w: BOUNDS.x + 2, h: BOUNDS.yMax, d: 0.5 }),
    )
    addShard(randRange(-2, 2), randRange(2, 4.5), zz - spacing / 2)
    r = otherReality(r)
  }
  return walls * spacing + 14
}

const easyPatterns: Pattern[] = [realityGate, splitWall, rotatingBar]
const midPatterns: Pattern[] = [realityGate, splitWall, rotatingBar, movingPillars, laserGrid, expandingRing, narrowPassage]
const latePatterns: Pattern[] = [...midPatterns, alternatingTunnel, movingCluster]

/** Spawns the next pattern and advances the spawn cursor with a fair gap. */
export function spawnNextPattern() {
  const t = runtime.time
  const diff = Math.min(1, t / 120)
  const z = WORLD.spawnZ

  let pattern: Pattern
  if (t < 16) pattern = pick(easyPatterns)
  else if (t >= runtime.nextCollapseTime) {
    pattern = realityCollapse
    runtime.nextCollapseTime = t + WORLD.collapseEvery
  } else if (t < 45) pattern = pick(midPatterns)
  else pattern = pick(latePatterns)

  const occupied = pattern(z, diff)
  const gap = Math.max(18, 34 - diff * 12)
  runtime.nextPatternDist = runtime.distance + occupied + gap
  return pattern === realityCollapse
}

export type { ShardInstance }
