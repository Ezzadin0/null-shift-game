import type { ObstacleInstance, Reality, ShardInstance } from '../types'
import { OVERDRIVE, SPEED } from '../utils/constants'

export interface Shockwave {
  t: number
  strength: number
  x: number
  y: number
}

/**
 * Mutable per-frame simulation state. Lives outside React so the animation
 * loop never allocates or triggers renders. The Zustand store mirrors a
 * low-frequency snapshot of this for the HUD.
 */
export interface Runtime {
  // player
  px: number
  py: number
  vx: number
  vy: number
  bank: number
  // input
  keys: { left: boolean; right: boolean; up: boolean; down: boolean }
  pointer: { x: number; y: number; active: boolean }
  // world
  speed: number
  distance: number
  time: number
  reality: Reality
  status: 'idle' | 'running' | 'dying'
  deathTimer: number
  introT: number
  // shift
  shiftCooldown: number
  shiftSlowmo: number
  lastShiftAt: number
  shiftPulse: number
  // overdrive
  energy: number
  overdrive: boolean
  overdriveTimer: number
  overdriveReadyPinged: boolean
  // scoring
  score: number
  combo: number
  comboTimer: number
  maxCombo: number
  shardsCollected: number
  // effects (decaying scalars read by render components)
  shake: number
  flash: number
  chroma: number
  nearMissSlowmo: number
  impactFreeze: number
  shockwaves: Shockwave[]
  explosionT: number
  explosionX: number
  explosionY: number
  // entities
  obstacles: ObstacleInstance[]
  shards: ShardInstance[]
  nextPatternDist: number
  nextCollapseTime: number
  idCounter: number
  // onboarding milestones
  sawOverdriveHint: boolean
}

const freshRuntime = (): Runtime => ({
  px: 0,
  py: 2,
  vx: 0,
  vy: 0,
  bank: 0,
  keys: { left: false, right: false, up: false, down: false },
  pointer: { x: 0, y: 0, active: false },
  speed: SPEED.base,
  distance: 0,
  time: 0,
  reality: 'cyan',
  status: 'idle',
  deathTimer: 0,
  introT: 0,
  shiftCooldown: 0,
  shiftSlowmo: 0,
  lastShiftAt: -10,
  shiftPulse: 0,
  energy: 0,
  overdrive: false,
  overdriveTimer: 0,
  overdriveReadyPinged: false,
  score: 0,
  combo: 0,
  comboTimer: 0,
  maxCombo: 0,
  shardsCollected: 0,
  shake: 0,
  flash: 0,
  chroma: 0,
  nearMissSlowmo: 0,
  impactFreeze: 0,
  shockwaves: [],
  explosionT: 0,
  explosionX: 0,
  explosionY: 0,
  obstacles: [],
  shards: [],
  nextPatternDist: 60,
  nextCollapseTime: 45,
  idCounter: 1,
  sawOverdriveHint: false,
})

export const runtime: Runtime = freshRuntime()

export function resetRuntime() {
  Object.assign(runtime, freshRuntime(), {
    // keep live input so held keys / pointer survive a restart
    keys: runtime.keys,
    pointer: runtime.pointer,
  })
}

export function addShockwave(strength: number, x = runtime.px, y = runtime.py) {
  runtime.shockwaves.push({ t: 0, strength, x, y })
  if (runtime.shockwaves.length > 5) runtime.shockwaves.shift()
}

/** Effective time scale applied to world simulation (not to player control). */
export function worldTimeScale(): number {
  if (runtime.impactFreeze > 0) return 0.02
  if (runtime.status === 'dying') return 0.18
  let s = 1
  if (runtime.shiftSlowmo > 0) s = Math.min(s, 0.32)
  if (runtime.nearMissSlowmo > 0) s = Math.min(s, 0.5)
  if (runtime.overdrive) s = Math.min(s, OVERDRIVE.worldTimeScale)
  return s
}
