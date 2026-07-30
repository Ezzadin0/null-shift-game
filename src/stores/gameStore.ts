import { create } from 'zustand'
import type { Phase, Popup, Reality, RunStats, Settings } from '../types'
import { OVERDRIVE, SHIFT, STORAGE_KEYS } from '../utils/constants'
import { addShockwave, resetRuntime, runtime } from '../game/runtime'
import { audio } from '../game/audio/AudioEngine'

interface HudSnapshot {
  score: number
  combo: number
  multiplier: number
  energy: number
  distance: number
  speedLevel: number
  shiftCooldownPct: number
  overdrive: boolean
}

interface GameState extends HudSnapshot {
  phase: Phase
  reality: Reality
  bestScore: number
  tutorialDone: boolean
  settings: Settings
  popups: Popup[]
  lastStats: RunStats | null
  webglOk: boolean

  setWebglOk: (ok: boolean) => void
  finishLoading: () => void
  startGame: () => void
  beginPlay: () => void
  pause: () => void
  resume: () => void
  togglePause: () => void
  restart: () => void
  toMenu: () => void
  endRun: (stats: RunStats) => void
  shiftReality: () => void
  activateOverdrive: () => void
  syncHud: (snap: HudSnapshot) => void
  addPopup: (text: string, variant: Popup['variant']) => void
  removePopup: (id: number) => void
  updateSettings: (patch: Partial<Settings>) => void
  markTutorialDone: () => void
  resetTutorial: () => void
}

const readJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback
  } catch {
    return fallback
  }
}

const defaultSettings: Settings = {
  sound: true,
  music: true,
  volume: 0.8,
  reducedMotion: false,
  highContrast: false,
  quality: 'high',
}

const loadedSettings = typeof window !== 'undefined' ? readJSON(STORAGE_KEYS.settings, defaultSettings) : defaultSettings
const loadedBest = typeof window !== 'undefined' ? Number(localStorage.getItem(STORAGE_KEYS.best) ?? 0) || 0 : 0
const loadedTutorial = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.tutorial) === '1' : false

audio.soundOn = loadedSettings.sound
audio.musicOn = loadedSettings.music
audio.volume = loadedSettings.volume

let popupId = 1

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'loading',
  reality: 'cyan',
  bestScore: loadedBest,
  tutorialDone: loadedTutorial,
  settings: loadedSettings,
  popups: [],
  lastStats: null,
  webglOk: true,
  score: 0,
  combo: 0,
  multiplier: 1,
  energy: 0,
  distance: 0,
  speedLevel: 1,
  shiftCooldownPct: 0,
  overdrive: false,

  setWebglOk: (ok) => set({ webglOk: ok }),

  finishLoading: () => set({ phase: 'menu' }),

  startGame: () => {
    audio.unlock()
    audio.gameStart()
    resetRuntime()
    runtime.status = 'running'
    set({
      phase: 'intro',
      reality: 'cyan',
      score: 0,
      combo: 0,
      multiplier: 1,
      energy: 0,
      distance: 0,
      overdrive: false,
      popups: [],
    })
  },

  beginPlay: () => {
    if (get().phase === 'intro') set({ phase: 'playing' })
  },

  pause: () => {
    if (get().phase === 'playing') set({ phase: 'paused' })
  },

  resume: () => {
    if (get().phase === 'paused') set({ phase: 'playing' })
  },

  togglePause: () => {
    const p = get().phase
    if (p === 'playing') set({ phase: 'paused' })
    else if (p === 'paused') set({ phase: 'playing' })
  },

  restart: () => {
    audio.uiClick()
    resetRuntime()
    runtime.status = 'running'
    set({
      phase: 'playing',
      reality: 'cyan',
      score: 0,
      combo: 0,
      multiplier: 1,
      energy: 0,
      distance: 0,
      overdrive: false,
      popups: [],
      lastStats: null,
    })
  },

  toMenu: () => {
    resetRuntime()
    set({ phase: 'menu', reality: 'cyan', popups: [], overdrive: false })
  },

  endRun: (stats) => {
    // clear the field so the wreck the player hit doesn't sit in front of the
    // game-over camera as it pulls back to the menu orbit
    runtime.obstacles.length = 0
    runtime.shards.length = 0
    const best = Math.max(get().bestScore, Math.round(stats.score))
    try {
      localStorage.setItem(STORAGE_KEYS.best, String(best))
      localStorage.setItem(STORAGE_KEYS.tutorial, '1')
    } catch {
      /* storage unavailable */
    }
    audio.gameOver()
    set({ phase: 'gameover', bestScore: best, lastStats: stats, tutorialDone: true })
  },

  shiftReality: () => {
    if (get().phase !== 'playing' || runtime.status !== 'running') return
    if (runtime.shiftCooldown > 0) return
    const next: Reality = runtime.reality === 'cyan' ? 'magenta' : 'cyan'
    runtime.reality = next
    runtime.shiftCooldown = SHIFT.cooldown
    runtime.shiftSlowmo = SHIFT.slowmoDuration
    runtime.lastShiftAt = runtime.time
    runtime.shiftPulse = 1
    runtime.chroma = Math.max(runtime.chroma, 1)
    runtime.shake = Math.max(runtime.shake, 0.35)
    runtime.flash = Math.max(runtime.flash, 0.45)
    addShockwave(1)
    audio.shift(next)
    set({ reality: next })
  },

  activateOverdrive: () => {
    if (get().phase !== 'playing' || runtime.status !== 'running') return
    if (runtime.overdrive || runtime.energy < OVERDRIVE.energyMax) return
    runtime.overdrive = true
    runtime.overdriveTimer = OVERDRIVE.duration
    runtime.energy = 0
    runtime.flash = Math.max(runtime.flash, 0.7)
    runtime.shake = Math.max(runtime.shake, 0.5)
    runtime.chroma = Math.max(runtime.chroma, 1.2)
    addShockwave(1.6)
    audio.overdrive()
    set({ overdrive: true })
    get().addPopup('OVERDRIVE', 'combo')
  },

  syncHud: (snap) => set(snap),

  addPopup: (text, variant) => {
    const id = popupId++
    set((s) => ({ popups: [...s.popups.slice(-3), { id, text, variant }] }))
    window.setTimeout(() => get().removePopup(id), 1600)
  },

  removePopup: (id) => set((s) => ({ popups: s.popups.filter((p) => p.id !== id) })),

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch }
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
    } catch {
      /* storage unavailable */
    }
    audio.setSound(settings.sound)
    audio.setVolume(settings.volume)
    if (settings.music !== get().settings.music) audio.setMusic(settings.music)
    set({ settings })
  },

  markTutorialDone: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.tutorial, '1')
    } catch {
      /* storage unavailable */
    }
    set({ tutorialDone: true })
  },

  resetTutorial: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.tutorial)
    } catch {
      /* storage unavailable */
    }
    set({ tutorialDone: false })
  },
}))
