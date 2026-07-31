import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { runtime } from '../game/runtime'
import { audio } from '../game/audio/AudioEngine'
import { OVERDRIVE, realityLabel } from '../utils/constants'
import { IconBolt, IconFullscreen, IconPause, IconShift } from './icons'
import { COPY } from './copy'

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

const HINT_TIMES = [1.2, 5.5, 11, 24] as const

function TutorialHints() {
  const [hint, setHint] = useState<{ ar: string; en: string } | null>(null)
  const shown = useRef(new Set<number>())

  useEffect(() => {
    const iv = window.setInterval(() => {
      for (let i = HINT_TIMES.length - 1; i >= 0; i--) {
        const at = HINT_TIMES[i]
        if (runtime.time >= at && runtime.time < at + 3.2) {
          if (!shown.current.has(i)) {
            shown.current.add(i)
            const next = COPY.hints[i]
            setHint(next)
            window.setTimeout(() => setHint((cur) => (cur === next ? null : cur)), 3000)
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
          key={hint.en}
          className="hint"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <span className="ar" dir="rtl" lang="ar" style={{ display: 'block', marginBottom: 4 }}>
            {hint.ar}
          </span>
          {hint.en}
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
  const label = realityLabel(reality)

  const toggleFullscreen = () => {
    audio.uiClick()
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }

  const energyCaption = overdrive
    ? { ar: COPY.hud.overdriveActiveAr, en: COPY.hud.overdriveActiveEn }
    : energyFull
      ? { ar: COPY.hud.overdriveReadyAr, en: COPY.hud.overdriveReadyEn }
      : { ar: COPY.hud.energyAr, en: COPY.hud.energyEn }

  return (
    <div className="hud">
      <FlashOverlay />
      <div className={`fx-edge ${overdrive ? 'overdrive' : ''}`} />
      <div className="crosshair" />

      <div className="hud-top">
        <div>
          <div className="hud-label">
            <span className="ar" dir="rtl" lang="ar">
              {COPY.hud.scoreAr}
            </span>
            <span className="en" style={{ marginInlineStart: 8 }}>
              {COPY.hud.scoreEn}
            </span>
          </div>
          <div className="hud-score">{score.toLocaleString()}</div>
          <div className="hud-stats" style={{ marginTop: 6 }}>
            <span>
              <span className="ar" dir="rtl" lang="ar">
                {COPY.hud.distanceAr}
              </span>{' '}
              <b>{distance}m</b>
            </span>
            <span>
              <span className="ar" dir="rtl" lang="ar">
                {COPY.hud.speedAr}
              </span>{' '}
              <b>LV{speedLevel}</b>
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
            <div className="hud-label">
              <span className="ar" dir="rtl" lang="ar">
                {COPY.hud.comboAr}
              </span>
              <span className="en" style={{ marginInlineStart: 6 }}>
                ×{combo}
              </span>
            </div>
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
              {p.ar && (
                <span className="ar" dir="rtl" lang="ar">
                  {p.ar}
                </span>
              )}
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
            <span className="ar" dir="rtl" lang="ar">
              {label.ar}
            </span>
            <span className="en">{label.en}</span>
          </div>
          <div className="shift-cd" style={{ marginTop: 8 }}>
            <i style={{ width: `${Math.round((1 - shiftCooldownPct) * 100)}%` }} />
          </div>
        </div>

        <div className="energy-wrap">
          <div className="hud-label" style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', gap: 8 }}>
            <span className="ar" dir="rtl" lang="ar">
              {energyCaption.ar}
            </span>
            <span className="en">{energyCaption.en}</span>
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
