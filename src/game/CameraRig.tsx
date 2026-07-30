import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { runtime, worldTimeScale } from './runtime'
import { useGameStore } from '../stores/gameStore'
import { SPEED } from '../utils/constants'
import { damp, lerp } from '../utils/math'

const look = new THREE.Vector3()

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const phase = useGameStore((s) => s.phase)
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)

  useFrame((state, dt) => {
    const r = runtime
    const t = state.clock.elapsedTime

    if (phase === 'menu' || phase === 'loading' || phase === 'gameover') {
      // slow orbital menu shot
      const a = t * 0.08
      camera.position.x = damp(camera.position.x, Math.sin(a) * 4.5, 1.4, dt)
      camera.position.y = damp(camera.position.y, 3.4 + Math.sin(t * 0.23) * 0.5, 1.4, dt)
      camera.position.z = damp(camera.position.z, 8.5, 1.4, dt)
      look.set(0, 2, -20)
      camera.lookAt(look)
      camera.fov = damp(camera.fov, 58, 2, dt)
      camera.updateProjectionMatrix()
      return
    }

    const introEase = phase === 'intro' ? 1 - Math.pow(1 - r.introT, 3) : 1
    const speedNorm = (r.speed - SPEED.base) / (SPEED.max - SPEED.base)

    const baseX = r.px * 0.55
    const baseY = 2.4 + r.py * 0.42
    const baseZ = 7.6

    // intro flies in from far above/behind
    const px = lerp(0, baseX, introEase)
    const py = lerp(9, baseY, introEase)
    const pz = lerp(30, baseZ, introEase)

    const shakeAmp = reducedMotion ? 0 : r.shake * 0.28
    const shakeX = (Math.random() - 0.5) * shakeAmp
    const shakeY = (Math.random() - 0.5) * shakeAmp
    const odBob = r.overdrive && !reducedMotion ? Math.sin(t * 9) * 0.07 : 0

    camera.position.x = damp(camera.position.x, px, 9, dt) + shakeX
    camera.position.y = damp(camera.position.y, py, 9, dt) + shakeY + odBob
    camera.position.z = damp(camera.position.z, pz, 6, dt)

    look.set(r.px * 0.75, r.py * 0.8 + 0.8, -14)
    camera.lookAt(look)
    camera.rotation.z += r.bank * 0.25

    const slowmoPunch = worldTimeScale() < 0.6 ? 4 : 0
    const targetFov = 60 + speedNorm * 16 + (r.overdrive ? 9 : 0) + r.shiftPulse * 5 - slowmoPunch
    camera.fov = damp(camera.fov, targetFov, 5, dt)
    camera.updateProjectionMatrix()
  })

  return null
}
