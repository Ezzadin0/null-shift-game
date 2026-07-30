import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGameStore } from '../stores/gameStore'
import { GameLoop } from '../systems/GameLoop'
import { Player } from './Player'
import { CameraRig } from './CameraRig'
import { World } from './World'
import { ObstacleField } from './Obstacles'
import { ShardField } from './Shards'
import { Explosion, PostFX, Shockwaves } from './Effects'

const DPR: Record<string, [number, number]> = {
  low: [0.75, 1],
  medium: [1, 1.5],
  high: [1, 2],
}

export function GameScene() {
  const quality = useGameStore((s) => s.settings.quality)

  return (
    <Canvas
      dpr={DPR[quality]}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 60, near: 0.1, far: 400, position: [0, 3.4, 8.5] }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Suspense fallback={null}>
        <GameLoop />
        <CameraRig />
        <World />
        <Player />
        <ObstacleField />
        <ShardField />
        <Shockwaves />
        <Explosion />
        <PostFX />
      </Suspense>
    </Canvas>
  )
}
