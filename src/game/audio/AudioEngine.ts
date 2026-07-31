import type { Reality } from '../../types'

/**
 * Fully procedural Web Audio synthesis. No samples, no external assets.
 * The context is created lazily on the first user interaction.
 */
class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private droneNodes: AudioNode[] = []
  private droneRunning = false

  soundOn = true
  musicOn = true
  volume = 0.8

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctx) return null
        this.ctx = new Ctx()
        this.master = this.ctx.createGain()
        this.master.gain.value = this.volume
        this.master.connect(this.ctx.destination)
        this.sfxBus = this.ctx.createGain()
        this.sfxBus.connect(this.master)
        this.musicBus = this.ctx.createGain()
        this.musicBus.gain.value = 0.4
        this.musicBus.connect(this.master)
      } catch {
        return null
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /** Call from any trusted user gesture to unlock audio. */
  unlock() {
    const ctx = this.ensure()
    if (ctx && this.musicOn) this.startDrone()
  }

  setVolume(v: number) {
    this.volume = v
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
  }

  setSound(on: boolean) {
    this.soundOn = on
  }

  setMusic(on: boolean) {
    this.musicOn = on
    if (on) this.startDrone()
    else this.stopDrone()
  }

  private startDrone() {
    const ctx = this.ensure()
    if (!ctx || !this.musicBus || this.droneRunning) return
    this.droneRunning = true

    const out = ctx.createGain()
    out.gain.value = 0
    out.gain.setTargetAtTime(0.5, ctx.currentTime, 2)
    out.connect(this.musicBus)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 320
    filter.Q.value = 4
    filter.connect(out)

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 140
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()

    // Root, a touch of detune, a fifth, and a neutral-ish upper partial —
    // a warmer, more open stack than an even-tempered triad.
    const freqs = [55, 55.4, 82.4, 97.9]
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator()
      o.type = i % 2 === 0 ? 'sawtooth' : 'triangle'
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = i === 0 ? 0.12 : 0.05
      o.connect(g)
      g.connect(filter)
      o.start()
      return o
    })

    // slow shimmering high partial
    const shimmer = ctx.createOscillator()
    shimmer.type = 'sine'
    shimmer.frequency.value = 660
    const shimmerGain = ctx.createGain()
    shimmerGain.gain.value = 0.006
    const shimmerLfo = ctx.createOscillator()
    shimmerLfo.frequency.value = 0.21
    const shimmerLfoGain = ctx.createGain()
    shimmerLfoGain.gain.value = 0.005
    shimmerLfo.connect(shimmerLfoGain)
    shimmerLfoGain.connect(shimmerGain.gain)
    shimmer.connect(shimmerGain)
    shimmerGain.connect(out)
    shimmer.start()
    shimmerLfo.start()

    this.droneNodes = [out, filter, lfo, lfoGain, ...oscs, shimmer, shimmerGain, shimmerLfo, shimmerLfoGain]
  }

  private stopDrone() {
    if (!this.ctx) return
    for (const n of this.droneNodes) {
      try {
        if (n instanceof OscillatorNode) n.stop()
        n.disconnect()
      } catch {
        /* already stopped */
      }
    }
    this.droneNodes = []
    this.droneRunning = false
  }

  // ---- one-shot synthesis helpers ----

  private tone(
    freq: number,
    opts: {
      type?: OscillatorType
      dur?: number
      gain?: number
      slideTo?: number
      delay?: number
      filterFreq?: number
    } = {},
  ) {
    if (!this.soundOn) return
    const ctx = this.ensure()
    if (!ctx || !this.sfxBus) return
    const { type = 'sine', dur = 0.15, gain = 0.2, slideTo, delay = 0, filterFreq } = opts
    const t0 = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(gain, t0 + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    let head: AudioNode = osc
    if (filterFreq) {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = filterFreq
      head.connect(f)
      head = f
    }
    head.connect(g)
    g.connect(this.sfxBus)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  }

  private noiseBurst(dur: number, gain: number, filterFreq: number, delay = 0, type: BiquadFilterType = 'lowpass') {
    if (!this.soundOn) return
    const ctx = this.ensure()
    if (!ctx || !this.sfxBus) return
    const t0 = ctx.currentTime + delay
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur))
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = filterFreq
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(f)
    f.connect(g)
    g.connect(this.sfxBus)
    src.start(t0)
  }

  // ---- game events ----

  uiHover() {
    this.tone(880, { type: 'sine', dur: 0.05, gain: 0.045 })
  }

  uiClick() {
    this.tone(520, { type: 'triangle', dur: 0.08, gain: 0.12 })
    this.tone(1040, { type: 'sine', dur: 0.06, gain: 0.06, delay: 0.02 })
  }

  gameStart() {
    // Rising gate-opening sting: low swell, then two bright confirmations.
    this.tone(110, { type: 'sawtooth', dur: 0.85, gain: 0.13, slideTo: 440, filterFreq: 1500 })
    this.tone(330, { type: 'triangle', dur: 0.45, gain: 0.1, delay: 0.12 })
    this.tone(494, { type: 'sine', dur: 0.5, gain: 0.09, delay: 0.32 })
    this.tone(988, { type: 'sine', dur: 0.6, gain: 0.06, delay: 0.5 })
    this.noiseBurst(0.5, 0.05, 1800, 0.05)
  }

  /** City reads clean and sharp; Desert reads lower, warmer and sandier. */
  shift(to: Reality) {
    const city = to === 'cyan'
    const base = city ? 960 : 560
    this.tone(base, {
      type: city ? 'square' : 'triangle',
      dur: city ? 0.11 : 0.16,
      gain: 0.09,
      slideTo: base * 2,
      filterFreq: city ? 3000 : 1500,
    })
    this.tone(base / 2, {
      type: 'sawtooth',
      dur: city ? 0.19 : 0.26,
      gain: 0.1,
      slideTo: base / 4,
      filterFreq: city ? 1400 : 780,
    })
    // City gets a crisp airy tick, Desert a softer grain wash.
    this.noiseBurst(city ? 0.12 : 0.22, city ? 0.1 : 0.075, city ? 3000 : 1100, 0, city ? 'highpass' : 'lowpass')
  }

  shard() {
    const f = 1180 + Math.random() * 280
    this.tone(f, { type: 'sine', dur: 0.09, gain: 0.1 })
    this.tone(f * 1.5, { type: 'sine', dur: 0.14, gain: 0.07, delay: 0.03 })
    this.tone(f * 2, { type: 'sine', dur: 0.1, gain: 0.03, delay: 0.06 })
  }

  nearMiss() {
    this.tone(300, { type: 'sawtooth', dur: 0.18, gain: 0.09, slideTo: 1300, filterFreq: 2200 })
    this.noiseBurst(0.1, 0.06, 3600, 0, 'highpass')
  }

  comboUp(tier: number) {
    const f = 500 + Math.min(tier, 8) * 90
    this.tone(f, { type: 'triangle', dur: 0.09, gain: 0.09 })
    this.tone(f * 1.26, { type: 'triangle', dur: 0.12, gain: 0.07, delay: 0.05 })
  }

  overdriveReady() {
    this.tone(660, { type: 'sine', dur: 0.14, gain: 0.11 })
    this.tone(880, { type: 'sine', dur: 0.14, gain: 0.11, delay: 0.12 })
    this.tone(1320, { type: 'sine', dur: 0.25, gain: 0.1, delay: 0.24 })
  }

  overdrive() {
    this.tone(80, { type: 'sawtooth', dur: 1.1, gain: 0.16, slideTo: 320, filterFreq: 900 })
    this.tone(440, { type: 'square', dur: 0.5, gain: 0.06, slideTo: 1760, filterFreq: 2400 })
    this.noiseBurst(0.7, 0.09, 1400)
    this.tone(1760, { type: 'sine', dur: 0.6, gain: 0.05, delay: 0.35 })
  }

  collision() {
    this.tone(160, { type: 'sawtooth', dur: 0.4, gain: 0.24, slideTo: 30, filterFreq: 800 })
    this.noiseBurst(0.45, 0.22, 900)
    this.noiseBurst(0.2, 0.12, 4000, 0, 'highpass')
  }

  gameOver() {
    this.tone(440, { type: 'triangle', dur: 0.5, gain: 0.1, slideTo: 220 })
    this.tone(330, { type: 'triangle', dur: 0.7, gain: 0.09, slideTo: 165, delay: 0.25 })
    this.tone(110, { type: 'sawtooth', dur: 1.4, gain: 0.1, slideTo: 55, delay: 0.4, filterFreq: 600 })
  }
}

export const audio = new AudioEngine()
