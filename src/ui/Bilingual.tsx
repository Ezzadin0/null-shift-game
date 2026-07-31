import type { ReactNode } from 'react'

interface BilingualProps {
  ar: string
  en: ReactNode
  /** `stack` puts Arabic above Latin; `inline` sets them side by side. */
  layout?: 'stack' | 'inline'
  className?: string
}

/**
 * Renders an Arabic/Latin label pair. The Arabic span carries `dir="rtl"` and
 * `lang="ar"` so the browser shapes and orders the script correctly, and the
 * `.ar` class resets the Latin letter-spacing that would otherwise pull the
 * cursive glyphs apart.
 */
export function Bilingual({ ar, en, layout = 'stack', className = '' }: BilingualProps) {
  return (
    <span className={`${layout === 'stack' ? 'bi' : 'bi-inline'} ${className}`.trim()}>
      <span className="ar" dir="rtl" lang="ar">
        {ar}
      </span>
      <span className="en">{en}</span>
    </span>
  )
}

/** Standalone Arabic run, for headings and body copy. */
export function Arabic({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`ar ${className}`.trim()} dir="rtl" lang="ar">
      {children}
    </span>
  )
}
