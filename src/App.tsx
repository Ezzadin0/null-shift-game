import { useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from './stores/gameStore'
import { useGameInput } from './hooks/useGameInput'
import { GameScene } from './game/GameScene'
import { MainMenu } from './ui/MainMenu'
import { HUD } from './ui/HUD'
import { PauseMenu } from './ui/PauseMenu'
import { GameOverScreen } from './ui/GameOverScreen'
import { IntroOverlay } from './ui/IntroOverlay'
import { LoadingScreen } from './ui/LoadingScreen'
import { CustomCursor } from './ui/CustomCursor'

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function WebGLFallback() {
  return (
    <div className="webgl-fallback">
      <div>
        <h1 className="title" style={{ fontSize: '2rem' }}>
          NULL<span className="slash">//</span>SHIFT
        </h1>
        <p>
          This experience requires WebGL, which your browser or device does not currently support. Try updating your browser,
          enabling hardware acceleration, or switching to a recent version of Chrome, Firefox, Edge, or Safari.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const reality = useGameStore((s) => s.reality)
  const settings = useGameStore((s) => s.settings)
  const webglOk = useMemo(detectWebGL, [])

  useGameInput()

  useEffect(() => {
    document.documentElement.dataset.reality = reality
  }, [reality])

  if (!webglOk) return <WebGLFallback />

  const inMenus = phase === 'menu' || phase === 'paused' || phase === 'gameover'
  const classes = [
    'app',
    inMenus ? 'menus-active' : '',
    settings.reducedMotion ? 'reduced-motion' : '',
    settings.highContrast ? 'high-contrast' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <GameScene />
      {(phase === 'playing' || phase === 'paused' || phase === 'intro') && <HUD />}
      <AnimatePresence mode="wait">
        {phase === 'loading' && <LoadingScreen key="loading" />}
        {phase === 'menu' && <MainMenu key="menu" />}
        {phase === 'intro' && <IntroOverlay key="intro" />}
        {phase === 'paused' && <PauseMenu key="pause" />}
        {phase === 'gameover' && <GameOverScreen key="gameover" />}
      </AnimatePresence>
      {inMenus && <CustomCursor />}
    </div>
  )
}
