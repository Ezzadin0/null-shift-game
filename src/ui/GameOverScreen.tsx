import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'
import { Bilingual } from './Bilingual'
import { COPY } from './copy'

export function GameOverScreen() {
  const stats = useGameStore((s) => s.lastStats)
  const bestScore = useGameStore((s) => s.bestScore)
  const restart = useGameStore((s) => s.restart)
  const toMenu = useGameStore((s) => s.toMenu)

  if (!stats) return null
  const isNewBest = stats.score >= bestScore && stats.score > 0

  const statCells = [
    { ar: COPY.gameover.distanceAr, en: COPY.gameover.distanceEn, value: `${stats.distance.toLocaleString()}m` },
    { ar: COPY.gameover.timeAr, en: COPY.gameover.timeEn, value: `${stats.time}s` },
    { ar: COPY.gameover.comboAr, en: COPY.gameover.comboEn, value: `×${stats.maxCombo}` },
    { ar: COPY.gameover.shardsAr, en: COPY.gameover.shardsEn, value: String(stats.shards) },
  ]

  return (
    <motion.div
      className="overlay dim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <motion.div
        className="brand"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h1 className="title-ar" style={{ fontSize: 'clamp(1.7rem, 5vw, 3.2rem)' }} dir="rtl" lang="ar">
          {COPY.gameover.titleAr}
        </h1>
        <p className="title glitch" data-text={COPY.gameover.titleEn} style={{ fontSize: 'clamp(1.1rem, 3.4vw, 2.1rem)' }}>
          {COPY.gameover.titleEn}
        </p>

        <div className="stats-grid">
          <div className="stat big">
            <div className="hud-label">
              <span className="ar" dir="rtl" lang="ar">
                {COPY.gameover.finalAr}
              </span>
              <span className="en">{COPY.gameover.finalEn}</span>
            </div>
            <b>{stats.score.toLocaleString()}</b>
          </div>
          <div className="stat big">
            <div className="hud-label">
              <span className="ar" dir="rtl" lang="ar">
                {COPY.gameover.bestAr}
              </span>
              <span className="en">{isNewBest ? COPY.gameover.newBestEn : COPY.gameover.bestEn}</span>
            </div>
            <b>{bestScore.toLocaleString()}</b>
          </div>
          {statCells.map((c) => (
            <div className="stat" key={c.en}>
              <div className="hud-label">
                <span className="ar" dir="rtl" lang="ar">
                  {c.ar}
                </span>
                <span className="en">{c.en}</span>
              </div>
              <b>{c.value}</b>
            </div>
          ))}
        </div>

        <div className="menu-stack" style={{ marginTop: 6 }}>
          <UIButton variant="primary" onClick={restart} autoFocus>
            <Bilingual ar={COPY.gameover.restartAr} en={COPY.gameover.restartEn} />
          </UIButton>
          <UIButton onClick={toMenu}>
            <Bilingual ar={COPY.gameover.menuAr} en={COPY.gameover.menuEn} />
          </UIButton>
        </div>
        <p className="tagline">{COPY.gameover.hintEn}</p>
      </motion.div>
    </motion.div>
  )
}
