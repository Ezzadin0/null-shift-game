import { motion } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { UIButton } from './UIButton'

export function GameOverScreen() {
  const stats = useGameStore((s) => s.lastStats)
  const bestScore = useGameStore((s) => s.bestScore)
  const restart = useGameStore((s) => s.restart)
  const toMenu = useGameStore((s) => s.toMenu)

  if (!stats) return null
  const isNewBest = stats.score >= bestScore && stats.score > 0

  return (
    <motion.div
      className="overlay dim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
    >
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h1 className="title glitch" data-text="REALITY COLLAPSED" style={{ fontSize: 'clamp(1.7rem, 5.5vw, 3.4rem)' }}>
          REALITY<span className="slash">&nbsp;//&nbsp;</span>COLLAPSED
        </h1>

        <div className="stats-grid">
          <div className="stat big">
            <div className="hud-label">Final score</div>
            <b>{stats.score.toLocaleString()}</b>
          </div>
          <div className="stat big">
            <div className="hud-label">{isNewBest ? 'New best' : 'Best'}</div>
            <b>{bestScore.toLocaleString()}</b>
          </div>
          <div className="stat">
            <div className="hud-label">Distance</div>
            <b>{stats.distance.toLocaleString()}m</b>
          </div>
          <div className="stat">
            <div className="hud-label">Survival</div>
            <b>{stats.time}s</b>
          </div>
          <div className="stat">
            <div className="hud-label">Highest combo</div>
            <b>×{stats.maxCombo}</b>
          </div>
          <div className="stat">
            <div className="hud-label">Shards</div>
            <b>{stats.shards}</b>
          </div>
        </div>

        <div className="menu-stack" style={{ marginTop: 6 }}>
          <UIButton variant="primary" onClick={restart} autoFocus>
            Re-enter the Fracture
          </UIButton>
          <UIButton onClick={toMenu}>Main Menu</UIButton>
        </div>
        <p className="tagline">Press R to instantly re-enter</p>
      </motion.div>
    </motion.div>
  )
}
