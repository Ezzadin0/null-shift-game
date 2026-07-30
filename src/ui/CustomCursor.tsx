import { useEffect, useRef } from 'react'

/** Diamond reticle cursor shown on menu screens. */
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e: PointerEvent) => {
      el.style.left = `${e.clientX}px`
      el.style.top = `${e.clientY}px`
      const hovering = (e.target as HTMLElement | null)?.closest('button, input, a') != null
      el.classList.toggle('hovering', hovering)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return <div ref={ref} className="cursor" style={{ left: -100, top: -100 }} />
}
