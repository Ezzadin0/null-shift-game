import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'
import { ControlsPanel } from './ControlsPanel'
import { Bilingual } from './Bilingual'
import { COPY } from './copy'

export function PauseMenu() {
  const resume = useGameStore((s) => s.resume)
  const restart = useGameStore((s) => s.restart)
  const toMenu = useGameStore((s) => s.toMenu)
  const [showControls, setShowControls] = useState(false)

  return (
    <motion.div className="overlay dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <AnimatePresence mode="wait">
        {showControls ? (
          <ControlsPanel key="controls" onClose={() => setShowControls(false)} />
        ) : (
          <motion.div
            key="pause"
            className="brand"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="title-ar" style={{ fontSize: 'clamp(1.6rem, 4.5vw, 2.8rem)' }} dir="rtl" lang="ar">
              {COPY.pause.titleAr}
            </h1>
            <p className="title" style={{ fontSize: 'clamp(1rem, 3vw, 1.7rem)' }}>
              {COPY.pause.titleEn}
            </p>
            <div className="menu-stack">
              <UIButton variant="primary" onClick={resume} autoFocus>
                <Bilingual ar={COPY.pause.resumeAr} en={COPY.pause.resumeEn} />
              </UIButton>
              <UIButton onClick={restart}>
                <Bilingual ar={COPY.pause.restartAr} en={COPY.pause.restartEn} />
              </UIButton>
              <UIButton onClick={() => setShowControls(true)}>
                <Bilingual ar={COPY.menu.controlsAr} en={COPY.menu.controlsEn} />
              </UIButton>
              <UIButton onClick={toMenu}>
                <Bilingual ar={COPY.pause.quitAr} en={COPY.pause.quitEn} />
              </UIButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
