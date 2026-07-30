import { useEffect } from 'react'
import { runtime } from '../game/runtime'
import { useGameStore } from '../stores/gameStore'
import { audio } from '../game/audio/AudioEngine'

const STEER_KEYS: Record<string, keyof typeof runtime.keys> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
}

/** Global keyboard / pointer / touch input + tab-blur autopause. */
export function useGameInput() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = useGameStore.getState()
      const steer = STEER_KEYS[e.code]
      if (steer) {
        runtime.keys[steer] = true
        if (s.phase === 'playing') e.preventDefault()
        return
      }
      switch (e.code) {
        case 'Space': {
          e.preventDefault()
          if (e.repeat) return
          if (s.phase === 'intro') s.beginPlay()
          else if (s.phase === 'playing') s.shiftReality()
          break
        }
        case 'Enter': {
          if (s.phase === 'intro') s.beginPlay()
          break
        }
        case 'ShiftLeft':
        case 'ShiftRight': {
          if (e.repeat) return
          if (s.phase === 'playing') s.activateOverdrive()
          break
        }
        case 'KeyP':
        case 'Escape': {
          if (e.repeat) return
          if (s.phase === 'playing' || s.phase === 'paused') {
            audio.uiClick()
            s.togglePause()
          }
          break
        }
        case 'KeyR': {
          if (e.repeat) return
          if (s.phase === 'gameover') s.restart()
          break
        }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const steer = STEER_KEYS[e.code]
      if (steer) runtime.keys[steer] = false
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const s = useGameStore.getState()
      if (s.phase !== 'playing') return
      runtime.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      runtime.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
      runtime.pointer.active = true
    }

    let touchId: number | null = null
    let touchStart = { x: 0, y: 0, px: 0, py: 0 }
    const onTouchStart = (e: TouchEvent) => {
      const s = useGameStore.getState()
      if (s.phase !== 'playing') return
      const t = e.changedTouches[0]
      // ignore touches that begin on UI buttons
      if ((t.target as HTMLElement | null)?.closest('button')) return
      touchId = t.identifier
      touchStart = { x: t.clientX, y: t.clientY, px: runtime.px, py: runtime.py }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (touchId === null) return
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== touchId) continue
        const dx = ((t.clientX - touchStart.x) / window.innerWidth) * 20
        const dy = ((t.clientY - touchStart.y) / window.innerHeight) * -14
        runtime.pointer.x = Math.max(-1, Math.min(1, (touchStart.px + dx) / 6.2))
        runtime.pointer.y = Math.max(-1, Math.min(1, (touchStart.py + dy - 3.5) / 2.8))
        runtime.pointer.active = true
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchId) touchId = null
      }
    }

    const onVisibility = () => {
      if (document.hidden) useGameStore.getState().pause()
    }
    const onBlur = () => useGameStore.getState().pause()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}
