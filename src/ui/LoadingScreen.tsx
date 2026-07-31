import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { COPY } from './copy'

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

  const stage = progress < 0.4 ? 0 : progress < 0.8 ? 1 : 2

  return (
    <motion.div className="overlay dim" exit={{ opacity: 0, transition: { duration: 0.5 } }}>
      <h1 className="title-ar" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.6rem)' }} dir="rtl" lang="ar">
        {COPY.brand.titleAr}
      </h1>
      <p className="title" style={{ fontSize: 'clamp(1rem, 3vw, 1.6rem)' }}>
        AHMAD <span className="amp">&amp;</span> LUAY
      </p>
      <div className="load-bar">
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div className="load-tag ar-body" dir="rtl" lang="ar" style={{ marginTop: 14 }}>
        {COPY.loading.stages[stage]}
      </div>
      <div className="load-tag" style={{ marginTop: 4 }}>
        {COPY.loading.stagesEn[stage]}
      </div>
    </motion.div>
  )
}
