import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { runtime } from '../game/runtime'
import { audio } from '../game/audio/AudioEngine'
import { OVERDRIVE } from '../utils/constants'
import { IconBolt, IconFullscreen, IconPause, IconShift } from './icons'

/** White flash overlay driven directly from the runtime each frame. */
function FlashOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      if (ref.current) ref.current.style.opacity = String(Math.min(0.85, runtime.flash * 0.8))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div ref={ref} className="fx-flash" />
}

const HINTS: Array<{ at: number; text: string }> = [
  { at: 1.2, text: 'Move to steer' },
  { at: 5.5, text: 'Space to shift reality' },
  { at: 11, text: 'Collect shards' },
  { at: 24, text: 'Shift activates overdrive when charged' },
]

function TutorialHints() {
  const [hint, setHint] = useState<string | null>(null)
  const shown = useRef(new Set<number>())

  useEffect(() => {
    const iv = window.setInterval(() => {
      for (let i = HINTS.length - 1; i >= 0; i--) {
        const h = HINTS[i]
        if (runtime.time >= h.at && runtime.time < h.at + 3.2) {
          if (!shown.current.has(i)) {
            shown.current.add(i)
            setHint(h.text)
            window.setTimeout(() => setHint((cur) => (cur === h.text ? null : cur)), 3000)
          }
          return
        }
      }
    }, 250)
    return () => window.clearInterval(iv)
  }, [])

  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          key={hint}
          className="hint"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {hint}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

export function HUD() {
  const score = useGameStore((s) => s.score)
  const combo = useGameStore((s) => s.combo)
  const multiplier = useGameStore((s) => s.multiplier)
  const energy = useGameStore((s) => s.energy)
  const distance = useGameStore((s) => s.distance)
  const speedLevel = useGameStore((s) => s.speedLevel)
  const shiftCooldownPct = useGameStore((s) => s.shiftCooldownPct)
  const overdrive = useGameStore((s) => s.overdrive)
  const reality = useGameStore((s) => s.reality)
  const popups = useGameStore((s) => s.popups)
  const tutorialDone = useGameStore((s) => s.tutorialDone)
  const pause = useGameStore((s) => s.pause)
  const shiftReality = useGameStore((s) => s.shiftReality)
  const activateOverdrive = useGameStore((s) => s.activateOverdrive)

  const energyPct = energy / OVERDRIVE.energyMax
  const energyFull = energyPct >= 1

  const toggleFullscreen = () => {
    audio.uiClick()
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }

  return (
    <div className="hud">
      <FlashOverlay />
      <div className={`fx-edge ${overdrive ? 'overdrive' : ''}`} />
      <div className="crosshair" />

      <div className="hud-top">
        <div>
          <div className="hud-label">Score</div>
          <div className="hud-score">{score.toLocaleString()}</div>
          <div className="hud-stats" style={{ marginTop: 6 }}>
            <span>
              DIST <b>{distance}m</b>
            </span>
            <span>
              VEL <b>LV{speedLevel}</b>
            </span>
          </div>
        </div>
        <div className="hud-right">
          <div className="hud-buttons">
            <button className="hud-icon-btn" aria-label="Toggle fullscreen" onClick={toggleFullscreen}>
              <IconFullscreen />
            </button>
            <button
              className="hud-icon-btn"
              aria-label="Pause"
              onClick={() => {
                audio.uiClick()
                pause()
              }}
            >
              <IconPause />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {combo > 0 && (
          <motion.div
            className="hud-combo"
            key="combo"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
          >
            <div className="hud-label">Combo ×{combo}</div>
            <motion.div className="combo-mult" key={multiplier} initial={{ scale: 1.5 }} animate={{ scale: 1 }}>
              ×{multiplier}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="popup-layer">
        <AnimatePresence>
          {popups.map((p) => (
            <motion.div
              key={p.id}
              className={`popup ${p.variant}`}
              initial={{ opacity: 0, y: 18, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -22, scale: 1.06 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!tutorialDone && <TutorialHints />}

      <div className="hud-bottom">
        <div>
          <div className="reality-chip">
            <span className="reality-dot" />
            {reality === 'cyan' ? 'Cyan Reality' : 'Magenta Reality'}
          </div>
          <div className="shift-cd" style={{ marginTop: 8 }}>
            <i style={{ width: `${Math.round((1 - shiftCooldownPct) * 100)}%` }} />
          </div>
        </div>

        <div className="energy-wrap">
          <div className="hud-label" style={{ textAlign: 'center' }}>
            {overdrive ? 'OVERDRIVE ACTIVE' : energyFull ? 'OVERDRIVE READY — SHIFT' : 'Quantum Energy'}
          </div>
          <div className={`energy-bar ${energyFull || overdrive ? 'full' : ''}`}>
            <i style={{ transform: `scaleX(${overdrive ? 1 : energyPct})` }} />
          </div>
        </div>

        <div style={{ width: 120 }} />
      </div>

      {isTouchDevice && (
        <div className="touch-controls">
          <button className="touch-btn" onClick={activateOverdrive} disabled={!energyFull && !overdrive} aria-label="Overdrive">
            <IconBolt size={24} />
          </button>
          <button className="touch-btn" onClick={shiftReality} aria-label="Shift reality">
            <IconShift size={24} />
          </button>
        </div>
      )}
    </div>
  )
}
