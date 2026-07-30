import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'
import { ControlsPanel } from './ControlsPanel'

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
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            <motion.h1
              className="title glitch"
              data-text="NULL//SHIFT"
              initial={{ letterSpacing: '0.5em', opacity: 0 }}
              animate={{ letterSpacing: '0.14em', opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              NULL<span className="slash">//</span>SHIFT
            </motion.h1>
            <motion.p
              className="subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Fractured Reality
            </motion.p>

            <div className="menu-stack">
              <UIButton variant="primary" onClick={startGame} autoFocus>
                Enter the Fracture
              </UIButton>
              <UIButton onClick={() => setShowControls(true)}>Controls & Settings</UIButton>
            </div>

            {bestScore > 0 && (
              <div className="best-chip">
                BEST FRACTURE&nbsp;&nbsp;<b>{bestScore.toLocaleString()}</b>
              </div>
            )}

            <p className="tagline">Shift between realities. Survive the collapse.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
