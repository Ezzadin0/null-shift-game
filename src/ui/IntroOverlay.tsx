import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STEPS = [
  { at: 600, text: 'REALITY LINK ESTABLISHED' },
  { at: 2200, text: 'SPACE TO SHIFT' },
] as const

/** Text beats layered over the intro camera fly-in. */
export function IntroOverlay() {
  const [step, setStep] = useState(-1)

  useEffect(() => {
    const timers = STEPS.map((s, i) => window.setTimeout(() => setStep(i), s.at))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])

  return (
    <motion.div className="overlay" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        style={{ position: 'absolute', inset: 0, background: '#03040B', pointerEvents: 'none' }}
      />
      <AnimatePresence mode="wait">
        {step >= 0 && (
          <motion.div
            key={step}
            className="intro-text"
            initial={{ opacity: 0, letterSpacing: '1em' }}
            animate={{ opacity: 1, letterSpacing: '0.55em' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {STEPS[step].text}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="intro-skip">Space / Enter to skip</div>
    </motion.div>
  )
}
