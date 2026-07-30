import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'
import type { Quality } from '../types'

const CONTROLS: Array<{ action: string; keys: string[] }> = [
  { action: 'Steer', keys: ['W A S D', '← ↑ ↓ →', 'MOUSE'] },
  { action: 'Shift reality', keys: ['SPACE'] },
  { action: 'Overdrive (meter full)', keys: ['SHIFT'] },
  { action: 'Pause / resume', keys: ['P', 'ESC'] },
  { action: 'Restart (after collapse)', keys: ['R'] },
  { action: 'Skip intro', keys: ['SPACE', 'ENTER'] },
]

interface ControlsPanelProps {
  onClose: () => void
  showSettings?: boolean
}

export function ControlsPanel({ onClose, showSettings = true }: ControlsPanelProps) {
  const settings = useGameStore((s) => s.settings)
  const updateSettings = useGameStore((s) => s.updateSettings)
  const tutorialDone = useGameStore((s) => s.tutorialDone)
  const resetTutorial = useGameStore((s) => s.resetTutorial)
  const closeRef = useRef<HTMLButtonElement>(null)

  // focus the close button for keyboard users without scrolling the panel body
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <motion.div
      className="panel"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.97 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <h2>Protocol // Controls</h2>
      <div className="panel-rows">
        {CONTROLS.map((c) => (
          <div className="control-row" key={c.action}>
            <span>{c.action}</span>
            <span className="keys">
              {c.keys.map((k) => (
                <span className="key" key={k}>
                  {k}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      {showSettings && (
        <>
          <h2 style={{ marginTop: 28 }}>Systems // Settings</h2>
          <div className="panel-rows">
            <label className="setting-row">
              <span>Sound effects</span>
              <input
                type="checkbox"
                className="toggle"
                checked={settings.sound}
                onChange={(e) => updateSettings({ sound: e.target.checked })}
              />
            </label>
            <label className="setting-row">
              <span>Ambience</span>
              <input
                type="checkbox"
                className="toggle"
                checked={settings.music}
                onChange={(e) => updateSettings({ music: e.target.checked })}
              />
            </label>
            <label className="setting-row">
              <span>Master volume</span>
              <input
                type="range"
                className="slider"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
              />
            </label>
            <div className="setting-row">
              <span>Graphics</span>
              <div className="seg" role="group" aria-label="Graphics quality">
                {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                  <button key={q} className={settings.quality === q ? 'active' : ''} onClick={() => updateSettings({ quality: q })}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <label className="setting-row">
              <span>Reduced motion</span>
              <input
                type="checkbox"
                className="toggle"
                checked={settings.reducedMotion}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
              />
            </label>
            <label className="setting-row">
              <span>High contrast UI</span>
              <input
                type="checkbox"
                className="toggle"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              />
            </label>
            {tutorialDone && (
              <div className="setting-row">
                <span>Tutorial hints</span>
                <UIButton variant="ghost" onClick={resetTutorial}>
                  Replay
                </UIButton>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center' }}>
        <UIButton ref={closeRef} onClick={onClose}>
          Close
        </UIButton>
      </div>
    </motion.div>
  )
}
