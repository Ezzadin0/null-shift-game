import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { audio } from '../game/audio/AudioEngine'

interface UIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'icon'
}

/** Button with the shared energy-sweep styling and tiny UI response sounds. */
export const UIButton = forwardRef<HTMLButtonElement, UIButtonProps>(function UIButton(
  { variant = 'default', className = '', onMouseEnter, onClick, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`btn ${variant !== 'default' ? variant : ''} ${className}`.trim()}
      onMouseEnter={(e) => {
        audio.uiHover()
        onMouseEnter?.(e)
      }}
      onClick={(e) => {
        audio.unlock()
        audio.uiClick()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </button>
  )
})
