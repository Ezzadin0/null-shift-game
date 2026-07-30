import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'
import { ControlsPanel } from './ControlsPanel'

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
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>
              LINK<span className="slash">//</span>SUSPENDED
            </h1>
            <div className="menu-stack">
              <UIButton variant="primary" onClick={resume} autoFocus>
                Resume
              </UIButton>
              <UIButton onClick={restart}>Restart</UIButton>
              <UIButton onClick={() => setShowControls(true)}>Controls & Settings</UIButton>
              <UIButton onClick={toMenu}>Abandon Run</UIButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
