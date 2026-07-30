import type { Reality } from '../types'

export const COLORS = {
  cyan: { primary: '#00E5FF', secondary: '#38BDF8' },
  magenta: { primary: '#FF2E93', secondary: '#A855F7' },
  bgDeep: '#03040B',
  bgMid: '#070B1B',
  bgHigh: '#11132A',
  highlight: '#F8FAFC',
} as const

export const realityColor = (r: Reality) => COLORS[r].primary
export const realitySecondary = (r: Reality) => COLORS[r].secondary

/** Playfield half extents the glider can occupy. */
export const BOUNDS = { x: 6.2, yMin: 0.7, yMax: 6.4 } as const

export const PLAYER = {
  z: 0,
  halfW: 0.55,
  halfH: 0.4,
  halfD: 0.8,
  accel: 64,
  friction: 8.5,
  maxVel: 22,
} as const

export const SPEED = {
  base: 26,
  rampPerSec: 0.34,
  max: 62,
  menuDrift: 7,
} as const

export const SHIFT = {
  cooldown: 0.55,
  slowmoDuration: 0.13,
  slowmoScale: 0.32,
  graceAfterShift: 0.09,
  chainWindow: 1.0,
} as const

export const OVERDRIVE = {
  duration: 6,
  energyMax: 100,
  shardEnergy: 12,
  worldTimeScale: 0.88,
  scoreMult: 2,
} as const

export const COMBO = {
  window: 4.2,
  perTier: 3,
  maxMult: 12,
} as const

export const SCORE = {
  distancePerUnit: 6,
  shard: 150,
  nearMiss: 250,
  perfectPhase: 400,
} as const

export const NEAR_MISS = {
  radius: 1.55,
  slowmo: 0.08,
} as const

export const WORLD = {
  spawnZ: -160,
  despawnZ: 14,
  collapseEvery: 42,
} as const

export const STORAGE_KEYS = {
  best: 'nullshift.best',
  tutorial: 'nullshift.tutorial',
  settings: 'nullshift.settings',
} as const
