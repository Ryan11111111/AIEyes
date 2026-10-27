import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  }
}

export function LogoMark({ size = 30, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="18.25" stroke="currentColor" strokeOpacity=".24" />
      <path d="M6 20c3.9-6.2 8.6-9.3 14-9.3S30.1 13.8 34 20c-3.9 6.2-8.6 9.3-14 9.3S9.9 26.2 6 20Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="5.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="1.8" fill="currentColor" />
      <path d="M20 1.8v4.4M20 33.8v4.4M1.8 20h4.4M33.8 20h4.4" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export const SunIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
  </svg>
)

export const MoonIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20.3 14.4A8.5 8.5 0 0 1 9.6 3.7 8.8 8.8 0 1 0 20.3 14.4Z" />
  </svg>
)

export const SearchIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
)

export const ArrowUpRightIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const CheckIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m5 12.5 4.2 4.2L19 6.8" />
  </svg>
)

export const SparkIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M12 3.5c.8 4.6 3.9 7.7 8.5 8.5-4.6.8-7.7 3.9-8.5 8.5-.8-4.6-3.9-7.7-8.5-8.5 4.6-.8 7.7-3.9 8.5-8.5Z" />
  </svg>
)

export const RefreshIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M20 7.5V3.8m0 0h-3.7M20 3.8l-2.9 2.9A7.5 7.5 0 1 0 19.5 15" />
  </svg>
)

export const GlobeIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.8 9.5h16.4M3.8 14.5h16.4M12 3.5c2.1 2.5 3.2 5.4 3.2 8.5s-1.1 6-3.2 8.5c-2.1-2.5-3.2-5.4-3.2-8.5s1.1-6 3.2-8.5Z" />
  </svg>
)

export const DatabaseIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
    <path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6" />
  </svg>
)

export const LayersIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="m12 3.5 8.5 4.6L12 12.7 3.5 8.1 12 3.5Z" />
    <path d="m4.5 12.3 7.5 4 7.5-4M4.5 16.5l7.5 4 7.5-4" />
  </svg>
)

export const TerminalIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <path d="m7 9 3 3-3 3M13 15h4" />
  </svg>
)

export const GridIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
  </svg>
)

export const ListIcon = (props: IconProps) => (
  <svg {...base(props)}>
    <path d="M8.5 6h12M8.5 12h12M8.5 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
)
