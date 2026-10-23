import type { ReactNode } from 'react'
import { Icon, type IconName } from './icons'

interface EmptyStateProps {
  icon?: IconName
  title: string
  text?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'sparkles', title, text, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={20} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
