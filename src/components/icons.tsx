import type { SVGProps } from 'react'

/**
 * A small, hand-tuned icon set.
 *
 * Hand-rolled rather than pulled from a library so every glyph shares the same
 * 24px grid, 1.6 stroke and rounded joins — and so the install stays lean.
 */

export type IconName =
  | 'search'
  | 'compass'
  | 'sparkles'
  | 'calendar'
  | 'message'
  | 'user'
  | 'logout'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'arrowRight'
  | 'arrowUpRight'
  | 'swap'
  | 'plus'
  | 'check'
  | 'checkCircle'
  | 'x'
  | 'clock'
  | 'send'
  | 'menu'
  | 'users'
  | 'zap'
  | 'shield'
  | 'download'
  | 'edit'
  | 'award'
  | 'book'
  | 'target'
  | 'eye'
  | 'refresh'
  | 'mapPin'
  | 'mail'

const paths: Record<IconName, JSX.Element> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-3.6-3.6" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13.7 8.3 18.5 10 13.7 11.7 12 16.5 10.3 11.7 5.5 10 10.3 8.3z" />
      <path d="m18.4 15.4.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10.5h18" />
    </>
  ),
  message: (
    <path d="M20.5 14.5a3 3 0 0 1-3 3H8.5L4 20.8v-4.6a2.6 2.6 0 0 1-1.5-2.4V6.5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0" />
    </>
  ),
  logout: (
    <>
      <path d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5" />
      <path d="M9.5 8.5 6 12l3.5 3.5M6 12h9" />
    </>
  ),
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  swap: (
    <>
      <path d="M4 8.5h13l-3.2-3.2M20 15.5H7l3.2 3.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.7 2.7L16.2 9.5" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  send: <path d="M20.5 3.5 10.5 13.5M20.5 3.5l-6.4 17-3.6-7-7-3.6z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  users: (
    <>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a6 6 0 0 1 12 0" />
      <path d="M16.5 6.2a3 3 0 0 1 0 5.8M17.5 14.6a5.4 5.4 0 0 1 3.2 4.9" />
    </>
  ),
  zap: <path d="M13.5 3 5.5 13.8h5.2L10 21l8.5-11.2h-5.4z" />,
  shield: (
    <>
      <path d="M12 3.2 19.5 6v5.5c0 4.4-3 7.9-7.5 9.3-4.5-1.4-7.5-4.9-7.5-9.3V6z" />
      <path d="m9 12 2.2 2.2L15.3 10" />
    </>
  ),
  download: <path d="M12 4v10.5m0 0 4-4m-4 4-4-4M4.5 19.5h15" />,
  edit: (
    <>
      <path d="M15.8 4.6a2.2 2.2 0 0 1 3.1 3.1L9.5 17.1 5 18.5l1.4-4.5z" />
      <path d="m14 6.4 3.6 3.6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9.5" r="5.5" />
      <path d="m8.5 14.4-1.2 6.1 4.7-2.5 4.7 2.5-1.2-6.1" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.2A2 2 0 0 1 6.2 3H19v18H6.2A2 2 0 0 1 4 18.8z" />
      <path d="M4 17.4h15" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="0.9" />
    </>
  ),
  eye: (
    <>
      <path d="M2.6 12S6 6.2 12 6.2 21.4 12 21.4 12 18 17.8 12 17.8 2.6 12 2.6 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4.5V10h-5.5" />
    </>
  ),
  mapPin: (
    <>
      <path d="M19 10.4c0 5-7 10.1-7 10.1s-7-5.1-7-10.1a7 7 0 0 1 14 0z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7.5 8 5.6 8-5.6" />
    </>
  ),
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18, strokeWidth = 1.6, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}

export function StarIcon({
  size = 14,
  filled = true,
  ...rest
}: { size?: number; filled?: boolean } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="m12 3.4 2.6 5.5 5.9.8-4.3 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.5 9.7l5.9-.8z" />
    </svg>
  )
}
