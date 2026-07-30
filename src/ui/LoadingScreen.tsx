import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'

/** Short boot sequence shown once while the scene compiles behind it. */
export function LoadingScreen() {
  const finishLoading = useGameStore((s) => s.finishLoading)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1500)
      setProgress(p)
      if (p < 1) raf = requestAnimationFrame(tick)
      else finishLoading()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [finishLoading])

  return (
    <motion.div className="overlay dim" exit={{ opacity: 0, transition: { duration: 0.5 } }}>
      <h1 className="title" style={{ fontSize: 'clamp(1.6rem, 5vw, 3rem)' }}>
        NULL<span className="slash">//</span>SHIFT
      </h1>
      <div className="load-bar">
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="load-tag">
        {progress < 0.4 ? 'Calibrating fracture lattice' : progress < 0.8 ? 'Binding quantum core' : 'Reality link pending'}
      </div>
    </motion.div>
  )
}
