import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { addShockwave, runtime, worldTimeScale } from '../game/runtime'
import { audio } from '../game/audio/AudioEngine'
import { BOUNDS, COMBO, NEAR_MISS, OVERDRIVE, PLAYER, SCORE, SHIFT, SPEED, WORLD } from '../utils/constants'
import { clamp, damp, pick } from '../utils/math'
import { spawnNextPattern } from './patterns'
import type { ObstacleInstance } from '../types'
import { COPY } from '../ui/copy'

const NEAR_MISS_TEXTS = COPY.popups.nearMiss
const PHASE_TEXTS = COPY.popups.phase

/** Position of an obstacle including its oscillation offset. */
function obstaclePos(o: ObstacleInstance, t: number) {
  const ox = o.baseX + (o.oscAmpX ? Math.sin(t * o.oscFreq + o.oscPhase) * o.oscAmpX : 0)
  const oy = o.baseY + (o.oscAmpY ? Math.cos(t * o.oscFreq * 0.83 + o.oscPhase) * o.oscAmpY : 0)
  return { ox, oy }
}

/** Distance from the player to an obstacle's surface (rough, for near-miss). */
function surfaceDistance(o: ObstacleInstance): number {
  if (o.shape === 'ring') {
    const dx = runtime.px - o.x
    const dy = runtime.py - o.y
    return Math.abs(Math.hypot(dx, dy) - o.ringR) - o.h
  }
  if (o.shape === 'bar') {
    const dx = runtime.px - o.x
    const dy = runtime.py - o.y
    const cos = Math.cos(-o.rot)
    const sin = Math.sin(-o.rot)
    const lx = dx * cos - dy * sin
    const ly = dx * sin + dy * cos
    return Math.max(Math.abs(lx) - o.w, Math.abs(ly) - o.h)
  }
  return Math.max(Math.abs(runtime.px - o.x) - o.w, Math.abs(runtime.py - o.y) - o.h)
}

function intersectsPlayer(o: ObstacleInstance): boolean {
  if (Math.abs(o.z) > o.d + PLAYER.halfD) return false
  if (o.shape === 'ring') {
    const dist = Math.hypot(runtime.px - o.x, runtime.py - o.y)
    return Math.abs(dist - o.ringR) < o.h + PLAYER.halfH
  }
  if (o.shape === 'bar') {
    const cos = Math.cos(-o.rot)
    const sin = Math.sin(-o.rot)
    const dx = runtime.px - o.x
    const dy = runtime.py - o.y
    const lx = dx * cos - dy * sin
    const ly = dx * sin + dy * cos
    return Math.abs(lx) < o.w + PLAYER.halfW && Math.abs(ly) < o.h + PLAYER.halfH
  }
  return Math.abs(runtime.px - o.x) < o.w + PLAYER.halfW && Math.abs(runtime.py - o.y) < o.h + PLAYER.halfH
}

function awardCombo(kind: 'near' | 'phase') {
  const r = runtime
  r.combo += 1
  r.comboTimer = COMBO.window
  r.maxCombo = Math.max(r.maxCombo, r.combo)
  const mult = comboMultiplier()
  const base = kind === 'near' ? SCORE.nearMiss : SCORE.perfectPhase
  r.score += base * mult * (r.overdrive ? OVERDRIVE.scoreMult : 1)
  if (r.combo % COMBO.perTier === 0) audio.comboUp(r.combo / COMBO.perTier)
}

export const comboMultiplier = () => Math.min(COMBO.maxMult, 1 + Math.floor(runtime.combo / COMBO.perTier))

let hudAccumulator = 0

export function GameLoop() {
  const phase = useGameStore((s) => s.phase)

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const r = runtime
    const store = useGameStore.getState()

    // Menu / gameover: keep the world drifting slowly for the backdrop.
    if (phase === 'menu' || phase === 'gameover' || phase === 'loading') {
      r.distance += SPEED.menuDrift * dt
      decayEffects(r, dt)
      return
    }
    if (phase === 'paused') return

    // Intro: animate the fly-in, world at partial speed, no spawning.
    if (phase === 'intro') {
      r.introT = Math.min(1, r.introT + dt / 3.6)
      r.distance += SPEED.base * 0.5 * dt
      decayEffects(r, dt)
      if (r.introT >= 1) store.beginPlay()
      return
    }

    // ---- playing ----
    const ts = worldTimeScale()
    const wdt = dt * ts

    r.time += wdt
    r.impactFreeze = Math.max(0, r.impactFreeze - dt)
    r.shiftSlowmo = Math.max(0, r.shiftSlowmo - dt)
    r.nearMissSlowmo = Math.max(0, r.nearMissSlowmo - dt)
    r.shiftCooldown = Math.max(0, r.shiftCooldown - dt)
    decayEffects(r, dt)

    if (r.status === 'dying') {
      r.deathTimer -= dt
      r.explosionT += dt
      if (r.deathTimer <= 0) {
        store.endRun({
          score: Math.round(r.score),
          distance: Math.round(r.distance),
          maxCombo: r.maxCombo,
          shards: r.shardsCollected,
          time: Math.round(r.time),
        })
      }
      return
    }

    // speed ramp
    r.speed = Math.min(SPEED.max, SPEED.base + r.time * SPEED.rampPerSec)
    const worldSpeed = r.speed * (r.overdrive ? 1.25 : 1)
    r.distance += worldSpeed * wdt

    // ---- player control (real dt: controls stay responsive during slowmo) ----
    const k = r.keys
    const kx = (k.right ? 1 : 0) - (k.left ? 1 : 0)
    const ky = (k.up ? 1 : 0) - (k.down ? 1 : 0)
    if (kx !== 0 || ky !== 0) {
      r.pointer.active = false
      r.vx += kx * PLAYER.accel * dt
      r.vy += ky * PLAYER.accel * dt
      r.vx = clamp(r.vx, -PLAYER.maxVel, PLAYER.maxVel)
      r.vy = clamp(r.vy, -PLAYER.maxVel, PLAYER.maxVel)
    } else if (r.pointer.active) {
      const tx = r.pointer.x * BOUNDS.x
      const tyRange = (BOUNDS.yMax - BOUNDS.yMin) / 2
      const ty = BOUNDS.yMin + tyRange + r.pointer.y * tyRange
      r.vx = (tx - r.px) * 10
      r.vy = (ty - r.py) * 10
    }
    r.vx -= r.vx * Math.min(1, PLAYER.friction * dt)
    r.vy -= r.vy * Math.min(1, PLAYER.friction * dt)
    r.px = clamp(r.px + r.vx * dt, -BOUNDS.x, BOUNDS.x)
    r.py = clamp(r.py + r.vy * dt, BOUNDS.yMin, BOUNDS.yMax)
    r.bank = damp(r.bank, clamp(-r.vx * 0.055, -0.65, 0.65), 8, dt)

    // ---- spawning ----
    if (r.distance >= r.nextPatternDist) {
      const wasCollapse = spawnNextPattern()
      if (wasCollapse) store.addPopup(COPY.popups.collapse.en, 'warning', COPY.popups.collapse.ar)
    }

    // ---- obstacles ----
    const grace = r.time - r.lastShiftAt < SHIFT.graceAfterShift
    for (let i = r.obstacles.length - 1; i >= 0; i--) {
      const o = r.obstacles[i]
      o.z += worldSpeed * wdt
      const { ox, oy } = obstaclePos(o, r.time)
      o.x = ox
      o.y = oy
      o.rot += o.rotSpeed * wdt
      if (o.shape === 'ring') {
        o.ringR += o.ringGrow * wdt
        if (o.ringR > 9) {
          o.ringR = 1.2
        }
      }

      if (o.z > WORLD.despawnZ) {
        r.obstacles.splice(i, 1)
        continue
      }

      const dangerous = o.reality === r.reality
      // track closest approach while the obstacle is near the player's plane
      if (Math.abs(o.z) < 3.2) {
        o.closest = Math.min(o.closest, surfaceDistance(o))
      }

      if (dangerous && !r.overdrive && !grace && intersectsPlayer(o)) {
        killPlayer()
        break
      }

      // passing the player plane: near-miss / perfect-phase rewards
      if (!o.passed && o.z > o.d + PLAYER.halfD + 0.2) {
        o.passed = true
        if (!o.rewarded && o.closest < NEAR_MISS.radius) {
          o.rewarded = true
          if (dangerous && !r.overdrive) {
            r.nearMissSlowmo = NEAR_MISS.slowmo
            r.flash = Math.max(r.flash, 0.15)
            addShockwave(0.45)
            audio.nearMiss()
            awardCombo('near')
            const nm = pick(NEAR_MISS_TEXTS)
            store.addPopup(nm.en, 'near', nm.ar)
          } else if (!dangerous && r.time - r.lastShiftAt < SHIFT.chainWindow && o.closest < 1.0) {
            audio.nearMiss()
            awardCombo('phase')
            const ph = pick(PHASE_TEXTS)
            store.addPopup(ph.en, 'phase', ph.ar)
          }
        }
      }
    }

    // ---- shards ----
    for (let i = r.shards.length - 1; i >= 0; i--) {
      const s = r.shards[i]
      s.z += worldSpeed * wdt
      s.spin += wdt * 2.4
      if (s.z > WORLD.despawnZ) {
        r.shards.splice(i, 1)
        continue
      }
      if (!s.collected && Math.abs(s.z) < 1.4) {
        const d = Math.hypot(r.px - s.x, r.py - s.y)
        if (d < 1.25) {
          s.collected = true
          r.shardsCollected += 1
          const hadEnergy = r.energy
          r.energy = Math.min(OVERDRIVE.energyMax, r.energy + OVERDRIVE.shardEnergy)
          r.score += SCORE.shard * comboMultiplier() * (r.overdrive ? OVERDRIVE.scoreMult : 1)
          r.comboTimer = Math.max(r.comboTimer, 1.6)
          audio.shard()
          if (r.energy >= OVERDRIVE.energyMax && hadEnergy < OVERDRIVE.energyMax) {
            audio.overdriveReady()
            if (!r.sawOverdriveHint) {
              r.sawOverdriveHint = true
              store.addPopup(COPY.hud.overdriveReadyEn, 'system', COPY.hud.overdriveReadyAr)
            }
          }
          r.shards.splice(i, 1)
        }
      }
    }

    // ---- combo decay ----
    if (r.combo > 0) {
      r.comboTimer -= wdt
      if (r.comboTimer <= 0) {
        r.combo = 0
      }
    }

    // ---- overdrive ----
    if (r.overdrive) {
      r.overdriveTimer -= dt
      if (r.overdriveTimer <= 0) {
        r.overdrive = false
        useGameStore.setState({ overdrive: false })
      }
    }

    // ---- distance score ----
    r.score += worldSpeed * wdt * (SCORE.distancePerUnit / 6) * comboMultiplier() * (r.overdrive ? OVERDRIVE.scoreMult : 1)

    // ---- HUD sync at ~12 Hz ----
    hudAccumulator += dt
    if (hudAccumulator > 0.085) {
      hudAccumulator = 0
      store.syncHud({
        score: Math.round(r.score),
        combo: r.combo,
        multiplier: comboMultiplier(),
        energy: r.energy,
        distance: Math.round(r.distance),
        speedLevel: 1 + Math.floor((r.speed - SPEED.base) / 6),
        shiftCooldownPct: r.shiftCooldown / SHIFT.cooldown,
        overdrive: r.overdrive,
      })
    }
  })

  return null
}

function decayEffects(r: typeof runtime, dt: number) {
  r.shake = Math.max(0, r.shake - dt * 2.2)
  r.flash = Math.max(0, r.flash - dt * 2.8)
  r.chroma = Math.max(0, r.chroma - dt * 3.4)
  r.shiftPulse = Math.max(0, r.shiftPulse - dt * 3)
  for (let i = r.shockwaves.length - 1; i >= 0; i--) {
    r.shockwaves[i].t += dt
    if (r.shockwaves[i].t > 1.2) r.shockwaves.splice(i, 1)
  }
}

function killPlayer() {
  const r = runtime
  r.status = 'dying'
  r.deathTimer = 1.5
  r.explosionT = 0
  r.explosionX = r.px
  r.explosionY = r.py
  r.impactFreeze = 0.09
  r.shake = 1
  r.flash = 1
  r.chroma = 1.6
  addShockwave(1.8)
  audio.collision()
}
