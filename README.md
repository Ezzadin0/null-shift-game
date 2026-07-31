# لعبة أحمد ولؤي — AHMAD & LUAY

### KINGDOM SHIFT — بوابة المملكة

A fast-paced 3D arcade game set inside a collapsing digital kingdom. You pilot a
quantum falcon glider that flies forward automatically through a procedural neon
corridor existing in two overlapping realities — **City** (واقع المدينة) and
**Desert** (واقع الصحراء). Press SPACE to shift between them: obstacles are only
solid in their matching reality, and the opposite reality's obstacles turn
ghost-like and harmless.

> بين المدينة والصحراء... حافظ على استقرار البوابة.
>
> Between city and desert... keep the gate stable.

Steer, phase through danger, collect quantum shards, chain near misses into
combos, and unleash Overdrive to survive the collapse as long as possible.

Everything — visuals, world, and audio — is generated procedurally at runtime.
No image assets, no backend, no API keys. The only bundled binary assets are the
Arabic webfonts, installed from npm and served locally.

**Play:** https://ezzadin0.github.io/null-shift-game/

## Controls

| Action | Input |
| --- | --- |
| Steer / التوجيه | Mouse, `W A S D`, or arrow keys |
| Shift reality / تبديل الواقع | `SPACE` |
| Overdrive / الاندفاع (when energy is full) | `SHIFT` |
| Pause / إيقاف مؤقت | `P` or `ESC` |
| Restart / إعادة (after collapse) | `R` |
| Skip intro / تخطي المقدمة | `SPACE` / `ENTER` |

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
- @fontsource/noto-kufi-arabic and @fontsource/cairo for bundled Arabic type

## Art direction

An original Saudi-inspired cyber-futuristic identity: deep emerald and bright
energy green for City Reality, sand gold and warm amber for Desert Reality, set
against a near-black green ground. Geometry is abstract throughout — eight-point
star motifs, pointed arch silhouettes, stylised palm forms and mesa
formations — with no national emblem, flag, or reproduction of any real
building.

| Role | Colour |
| --- | --- |
| Deep emerald | `#006C4C` |
| Bright energy green | `#00E59A` |
| Sand gold | `#D8A84E` |
| Warm light gold | `#FFD98A` |
| Deep black | `#020706` |
| Dark green-black | `#061410` |
| Off-white | `#F7F5EC` |

## Project structure

```
src/
  game/            three.js scene: player, world, obstacles, shards, effects
    audio/         procedural Web Audio engine
    runtime.ts     mutable per-frame simulation state (outside React)
  systems/         game loop + procedural obstacle pattern generator
  stores/          zustand store (phase, HUD snapshot, settings, persistence)
  ui/              menus, HUD, overlays, bilingual copy dictionary
  hooks/           global input handling
  utils/           constants and math helpers
  types/           shared TypeScript types
  styles/          global CSS (theme, HUD, panels, accessibility modes)
```

## Notes on the bilingual interface

Arabic and English are shown together throughout. Arabic runs carry `dir="rtl"`
and `lang="ar"`, and reset the Latin `letter-spacing` to `normal` — tracking
applied to a cursive script pulls the joined glyphs apart and makes words hard
to read. Fonts are bundled through npm rather than fetched from a CDN, so the
interface renders identically offline and behind the Pages base path.

The two realities keep the internal keys `cyan` and `magenta` throughout the
code. Collision, spawning, pooling, and the shift mechanic all branch on those
keys, so only their presentation was rebranded — renaming them would have
touched gameplay logic for no visible benefit.

## Performance notes

- The simulation lives in a mutable runtime object; React state is only synced
  at ~12 Hz for the HUD, so the render loop causes no React re-renders.
- World geometry (towers, mesas, debris, light strips, motifs, particles) uses
  instanced meshes and recycled objects that wrap around the corridor. The
  City and Desert layers are both always resident and cross-fade by opacity,
  so shifting reality allocates nothing.
- Obstacles render from a fixed pool of mesh slots; collision uses cheap
  bounding volumes (AABBs, rotated-bar frames, ring annuli).
- Graphics settings (Low / Medium / High) control device pixel ratio,
  antialiasing, and the post-processing stack; Low disables post-processing
  entirely. Reduced-motion and high-contrast UI options are in Settings.
- Best score, settings, and tutorial progress persist in `localStorage`.
- The game pauses automatically when the tab loses focus.

## Deployment

Pushes to `main` build and publish to GitHub Pages via
`.github/workflows/deploy-pages.yml`. The Vite production base path is
`/null-shift-game/`; local development still serves from `/`.
