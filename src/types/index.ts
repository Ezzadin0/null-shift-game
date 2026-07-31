export type Reality = 'cyan' | 'magenta'

export type Phase = 'loading' | 'menu' | 'intro' | 'playing' | 'paused' | 'gameover'

export type Quality = 'low' | 'medium' | 'high'

/** Shape rendered for an obstacle slot. Complex patterns are compositions of these. */
export type ObstacleShape = 'box' | 'bar' | 'ring'

export interface ObstacleInstance {
  id: number
  shape: ObstacleShape
  reality: Reality
  /** Center position. z is negative ahead of the player and increases toward the player at z=0. */
  x: number
  y: number
  z: number
  /** Half extents for boxes/bars (bar: w = half length along its local axis). */
  w: number
  h: number
  d: number
  /** Current rotation (radians, around z axis) and angular speed for bars / spinners. */
  rot: number
  rotSpeed: number
  /** Lateral oscillation: x/y amplitude, angular frequency, phase. */
  oscAmpX: number
  oscAmpY: number
  oscFreq: number
  oscPhase: number
  /** Ring: current radius grows from ringR at ringGrow units/s. Tube radius = h. */
  ringR: number
  ringGrow: number
  /** Base spawn coords so oscillation is stable. */
  baseX: number
  baseY: number
  /** Bookkeeping for near-miss / phase-chain detection. */
  closest: number
  passed: boolean
  rewarded: boolean
}

export interface ShardInstance {
  id: number
  x: number
  y: number
  z: number
  collected: boolean
  spin: number
}

export interface RunStats {
  score: number
  distance: number
  maxCombo: number
  shards: number
  time: number
}

export interface Popup {
  id: number
  text: string
  /** Optional Arabic line rendered above the Latin callout. */
  ar?: string
  variant: 'near' | 'phase' | 'combo' | 'system' | 'warning'
}

export interface Settings {
  sound: boolean
  music: boolean
  volume: number
  reducedMotion: boolean
  highContrast: boolean
  quality: Quality
}
