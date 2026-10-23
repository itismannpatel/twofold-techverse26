import type { CSSProperties } from 'react'
import type { User } from '../data/types'
import { initials } from '../lib/format'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface AvatarProps {
  user: Pick<User, 'name' | 'hue'>
  size?: AvatarSize
  ring?: boolean
  online?: boolean
  className?: string
}

/**
 * Deterministic gradient avatar — no image assets, no network, but each student
 * keeps a stable, recognisable colour derived from their user record.
 */
export function Avatar({ user, size = 'md', ring = false, online = false, className = '' }: AvatarProps) {
  const classes = ['avatar', `avatar-${size}`, ring ? 'avatar-ring' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      style={{ '--h': user.hue } as CSSProperties}
      title={user.name}
      aria-hidden="true"
    >
      {initials(user.name)}
      {online && <span className="avatar-dot" />}
    </div>
  )
}
