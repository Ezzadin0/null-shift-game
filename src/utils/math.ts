export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Frame-rate independent exponential smoothing toward a target. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))

export const randRange = (min: number, max: number) => min + Math.random() * (max - min)

export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
