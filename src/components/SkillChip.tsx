import { SKILL_BY_ID } from '../data/catalog'
import type { Level } from '../data/types'

interface SkillChipProps {
  skillId: string
  level?: Level
  tone?: 'teach' | 'learn' | 'neutral'
  large?: boolean
  onRemove?: () => void
}

export function SkillChip({ skillId, level, tone = 'neutral', large, onRemove }: SkillChipProps) {
  const skill = SKILL_BY_ID[skillId]
  if (!skill) return null

  const classes = [
    'chip',
    tone === 'teach' ? 'chip-ember' : '',
    tone === 'learn' ? 'chip-mint' : '',
    large ? 'chip-lg' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} title={level ? `${skill.name} · ${level}` : skill.name}>
      {skill.name}
      {level && <span style={{ opacity: 0.6, fontSize: '0.7em' }}>{level}</span>}
      {onRemove && (
        <button type="button" className="chip-x" onClick={onRemove} aria-label={`Remove ${skill.name}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </span>
  )
}
