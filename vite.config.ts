import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The production bundle is served from a GitHub Pages project subpath
// (https://ezzadin0.github.io/null-shift-game/), so assets must resolve
// against that prefix. Dev keeps the root base so localhost works normally.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/null-shift-game/' : '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
  },
}))
