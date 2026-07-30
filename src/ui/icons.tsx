interface IconProps {
  size?: number
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const IconSoundOn = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
    <path d="M18.5 6.5a8 8 0 0 1 0 11" />
  </svg>
)

export const IconSoundOff = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16 9l5 6M21 9l-5 6" />
  </svg>
)

export const IconMusic = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="7" cy="18" r="2.4" />
    <circle cx="17" cy="16" r="2.4" />
    <path d="M9.4 18V6.5L19.4 4v12" />
  </svg>
)

export const IconPause = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M8 5v14M16 5v14" />
  </svg>
)

export const IconFullscreen = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </svg>
)

export const IconShift = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3l6 6h-4v6h-4V9H6l6-6z" />
    <path d="M6 19h12" />
  </svg>
)

export const IconBolt = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
  </svg>
)
