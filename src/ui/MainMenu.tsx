import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'
import { ControlsPanel } from './ControlsPanel'
import { Bilingual } from './Bilingual'
import { COPY } from './copy'

export function MainMenu() {
  const startGame = useGameStore((s) => s.startGame)
  const bestScore = useGameStore((s) => s.bestScore)
  const [showControls, setShowControls] = useState(false)

  return (
    <motion.div
      className="overlay dim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {showControls ? (
          <ControlsPanel key="controls" onClose={() => setShowControls(false)} />
        ) : (
          <motion.div
            key="menu"
            className="brand"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <motion.h1
              className="title-ar"
              dir="rtl"
              lang="ar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              {COPY.brand.titleAr}
            </motion.h1>

            <motion.p
              className="title glitch"
              data-text={COPY.brand.titleEn}
              initial={{ letterSpacing: '0.5em', opacity: 0 }}
              animate={{ letterSpacing: '0.2em', opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              AHMAD <span className="amp">&amp;</span> LUAY
            </motion.p>

            <motion.div
              className="title-rule"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            />

            <motion.p
              className="subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.4 }}
            >
              {COPY.brand.subtitleEn}
            </motion.p>

            <motion.p
              className="subtitle-ar"
              dir="rtl"
              lang="ar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42, duration: 0.4 }}
            >
              {COPY.brand.subtitleAr}
            </motion.p>

            <div className="menu-stack">
              <UIButton variant="primary" onClick={startGame} autoFocus>
                <Bilingual ar={COPY.menu.startAr} en={COPY.menu.startEn} />
              </UIButton>
              <UIButton onClick={() => setShowControls(true)}>
                <Bilingual ar={COPY.menu.controlsAr} en={COPY.menu.controlsEn} />
              </UIButton>
            </div>

            {bestScore > 0 && (
              <div className="best-chip">
                <span className="ar" dir="rtl" lang="ar">
                  {COPY.menu.bestAr}
                </span>
                <span style={{ margin: '0 10px', opacity: 0.5 }}>/</span>
                {COPY.menu.bestEn}&nbsp;&nbsp;<b>{bestScore.toLocaleString()}</b>
              </div>
            )}

            <p className="tagline-ar" dir="rtl" lang="ar">
              {COPY.menu.taglineAr}
            </p>
            <p className="tagline" style={{ marginTop: 8 }}>
              {COPY.menu.taglineEn}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
