# NULL//SHIFT — FRACTURED REALITY

A fast-paced 3D arcade game set inside a collapsing digital megacity. You pilot a
quantum glider that flies forward automatically through a procedural neon corridor
that exists in two overlapping realities — **Cyan** and **Magenta**. Press SPACE to
shift between them: obstacles are only solid in their matching reality, and the
opposite reality's obstacles turn ghost-like and harmless. Steer, phase through
danger, collect quantum shards, chain near misses into combos, and unleash
Overdrive to survive the collapse as long as possible.

Everything — visuals, world, and audio — is generated procedurally at runtime.
No assets, no backend, no API keys.

## Controls

| Action | Input |
| --- | --- |
| Steer | Mouse, `W A S D`, or arrow keys |
| Shift reality | `SPACE` |
| Overdrive (when energy is full) | `SHIFT` |
| Pause / resume | `P` or `ESC` |
| Restart (after collapse) | `R` |
| Skip intro | `SPACE` / `ENTER` |

Touch devices: drag to steer, with on-screen Shift and Overdrive buttons.

## Running

```bash
npm install
npm run dev        # development server (default http://localhost:5173)
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build locally
```

## Technologies

- Vite + React 18 + TypeScript
- Three.js via @react-three/fiber and @react-three/drei
- @react-three/postprocessing (bloom, chromatic aberration, noise, vignette)
- Zustand for game/UI state
- Framer Motion for interface transitions
- Web Audio API for fully procedural sound effects and the ambient drone

## Project structure

```
src/
  game/            three.js scene: player, world, obstacles, shards, effects
    audio/         procedural Web Audio engine
    runtime.ts     mutable per-frame simulation state (outside React)
  systems/         game loop + procedural obstacle pattern generator
  stores/          zustand store (phase, HUD snapshot, settings, persistence)
  ui/              menus, HUD, overlays (framer-motion)
  hooks/           global input handling
  utils/           constants and math helpers
  types/           shared TypeScript types
  styles/          global CSS (theme, HUD, panels, accessibility modes)
```

## Performance notes

- The simulation lives in a mutable runtime object; React state is only synced
  at ~12 Hz for the HUD, so the render loop causes no React re-renders.
- World geometry (towers, debris, light strips, glyphs, particles) uses
  instanced meshes and recycled/pooled objects that wrap around the corridor.
- Obstacles render from a fixed pool of mesh slots; collision uses cheap
  bounding volumes (AABBs, rotated-bar frames, ring annuli).
- Graphics settings (Low / Medium / High) control device pixel ratio,
  antialiasing, and the post-processing stack; Low disables post-processing
  entirely. Reduced-motion and high-contrast UI options are in Settings.
- Best score, settings, and tutorial progress persist in `localStorage`.
- The game pauses automatically when the tab loses focus.
