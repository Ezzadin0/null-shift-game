import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { runtime } from './game/runtime.ts'
import { useGameStore } from './stores/gameStore.ts'

// Arabic webfonts are bundled from npm and emitted by Vite, so they resolve
// against the configured base path with no runtime network request.
import '@fontsource/noto-kufi-arabic/400.css'
import '@fontsource/noto-kufi-arabic/500.css'
import '@fontsource/noto-kufi-arabic/700.css'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/600.css'

import './styles/global.css'

if (import.meta.env.DEV) {
  // dev console handle for tuning and automated smoke tests
  Object.assign(window, { __nullshift: { runtime, store: useGameStore } })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
