import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { COPY } from './copy'

const TIMINGS = [600, 2200] as const

/** Text beats layered over the intro camera fly-in. */
export function IntroOverlay() {
  const [step, setStep] = useState(-1)

  useEffect(() => {
    const timers = TIMINGS.map((at, i) => window.setTimeout(() => setStep(i), at))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])

  return (
    <motion.div className="overlay" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        style={{ position: 'absolute', inset: 0, background: '#020706', pointerEvents: 'none' }}
      />
      <AnimatePresence mode="wait">
        {step >= 0 && (
          <motion.div
            key={step}
            className="intro-beat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="intro-text-ar" dir="rtl" lang="ar">
              {COPY.intro.beats[step].ar}
            </div>
            <motion.div
              className="intro-text"
              initial={{ letterSpacing: '1em', opacity: 0 }}
              animate={{ letterSpacing: '0.55em', opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {COPY.intro.beats[step].en}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="intro-skip">{COPY.intro.skip}</div>
    </motion.div>
  )
}
