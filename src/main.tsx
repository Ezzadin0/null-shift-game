import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { runtime } from './game/runtime.ts'
import { useGameStore } from './stores/gameStore.ts'
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
