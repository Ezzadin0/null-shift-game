import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'
import { Bilingual } from './Bilingual'
import { COPY } from './copy'
import type { Quality } from '../types'

interface ControlsPanelProps {
  onClose: () => void
  showSettings?: boolean
}

const settingLabel = (key: string) => COPY.controls.settings.find((s) => s.key === key)!

function SettingLabel({ settingKey }: { settingKey: string }) {
  const l = settingLabel(settingKey)
  return (
    <span>
      {l.en}
      <span className="label-ar" dir="rtl" lang="ar">
        {l.ar}
      </span>
    </span>
  )
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
      <h2>
        {COPY.controls.headingEn}
        <span className="ar" dir="rtl" lang="ar">
          {COPY.controls.headingAr}
        </span>
      </h2>
      <div className="panel-rows">
        {COPY.controls.rows.map((c) => (
          <div className="control-row" key={c.en}>
            <span className="action">
              <span>{c.en}</span>
              <span className="ar" dir="rtl" lang="ar">
                {c.ar}
              </span>
            </span>
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
          <h2 style={{ marginTop: 28 }}>
            {COPY.controls.settingsHeadingEn}
            <span className="ar" dir="rtl" lang="ar">
              {COPY.controls.settingsHeadingAr}
            </span>
          </h2>
          <div className="panel-rows">
            <label className="setting-row">
              <SettingLabel settingKey="sound" />
              <input
                type="checkbox"
                className="toggle"
                checked={settings.sound}
                onChange={(e) => updateSettings({ sound: e.target.checked })}
              />
            </label>
            <label className="setting-row">
              <SettingLabel settingKey="music" />
              <input
                type="checkbox"
                className="toggle"
                checked={settings.music}
                onChange={(e) => updateSettings({ music: e.target.checked })}
              />
            </label>
            <label className="setting-row">
              <SettingLabel settingKey="volume" />
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
              <SettingLabel settingKey="quality" />
              <div className="seg" role="group" aria-label="Graphics quality">
                {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                  <button key={q} className={settings.quality === q ? 'active' : ''} onClick={() => updateSettings({ quality: q })}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <label className="setting-row">
              <SettingLabel settingKey="reducedMotion" />
              <input
                type="checkbox"
                className="toggle"
                checked={settings.reducedMotion}
                onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
              />
            </label>
            <label className="setting-row">
              <SettingLabel settingKey="highContrast" />
              <input
                type="checkbox"
                className="toggle"
                checked={settings.highContrast}
                onChange={(e) => updateSettings({ highContrast: e.target.checked })}
              />
            </label>
            {tutorialDone && (
              <div className="setting-row">
                <SettingLabel settingKey="tutorial" />
                <UIButton variant="ghost" onClick={resetTutorial}>
                  {COPY.controls.replayEn}
                </UIButton>
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center' }}>
        <UIButton ref={closeRef} onClick={onClose}>
          <Bilingual ar={COPY.controls.closeAr} en={COPY.controls.closeEn} />
        </UIButton>
      </div>
    </motion.div>
  )
}
