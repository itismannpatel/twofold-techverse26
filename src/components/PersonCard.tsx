import { Link } from 'react-router-dom'
import type { User } from '../data/types'
import type { MatchResult } from '../lib/matching'
import { ratingFor } from '../data/api'
import { useApp } from '../context/AppContext'
import { Avatar } from './Avatar'
import { MatchRing } from './MatchRing'
import { RatingStars } from './Rating'
import { SkillChip } from './SkillChip'
import { Icon } from './icons'

interface PersonCardProps {
  person: User
  match?: MatchResult
}

export function PersonCard({ person, match }: PersonCardProps) {
  const { db } = useApp()
  const rating = ratingFor(person.id, db)
  const teaches = person.teaches.slice(0, 3)
  const wants = person.wants.slice(0, 2)

  return (
    <Link to={`/u/${person.id}`} className="card card-hover person-card">
      <div className="person-top">
        <Avatar user={person} size="lg" />
        <div className="grow">
          <div className="person-name">
            {person.name}
            {person.verified && (
              <span className="verified-dot" title="Verified student">
                <Icon name="checkCircle" size={13} strokeWidth={2} />
              </span>
            )}
          </div>
          <div className="person-meta">
            {person.branch} · {person.year}
          </div>
        </div>
        {match && <MatchRing score={match.score} size={46} stroke={3} />}
      </div>

      <p className="person-bio clamp-2">{person.bio}</p>

      <div className="person-skills">
        <div className="skill-group">
          <span className="skill-caption teach">
            <i /> Teaches
          </span>
          <div className="chip-row">
            {teaches.map((skill) => (
              <SkillChip key={skill.skillId} skillId={skill.skillId} tone="teach" />
            ))}
            {person.teaches.length > teaches.length && (
              <span className="chip">+{person.teaches.length - teaches.length}</span>
            )}
          </div>
        </div>

        <div className="skill-group">
          <span className="skill-caption learn">
            <i /> Wants to learn
          </span>
          <div className="chip-row">
            {wants.map((skill) => (
              <SkillChip key={skill.skillId} skillId={skill.skillId} tone="learn" />
            ))}
            {person.wants.length > wants.length && (
              <span className="chip">+{person.wants.length - wants.length}</span>
            )}
          </div>
        </div>
      </div>

      <div className="person-foot">
        <RatingStars value={rating.average} count={rating.count} />
        <span className="faint row gap-4" style={{ fontSize: '0.76rem' }}>
          Profile
          <Icon name="arrowUpRight" size={14} />
        </span>
      </div>
    </Link>
  )
}
