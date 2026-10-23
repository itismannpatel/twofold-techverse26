import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { MatchResult } from '../lib/matching'
import { MATCH_WEIGHTS } from '../lib/matching'
import { ratingFor } from '../data/api'
import { useApp } from '../context/AppContext'
import { Avatar } from './Avatar'
import { MatchRing } from './MatchRing'
import { RatingStars } from './Rating'
import { SkillChip } from './SkillChip'
import { RequestSessionModal } from './RequestSessionModal'
import { Icon } from './icons'

const BAR_TONE: Record<string, string> = {
  learn: '',
  teach: 'mint',
  affinity: 'gold',
  trust: 'grey',
}

export function MatchCard({ match }: { match: MatchResult }) {
  const { db } = useApp()
  const navigate = useNavigate()
  const [requestOpen, setRequestOpen] = useState(false)
  const rating = ratingFor(match.user.id, db)

  const bars: Array<{ key: keyof typeof MATCH_WEIGHTS; label: string; value: number }> = [
    { key: 'learn', label: 'Learn', value: match.breakdown.learn },
    { key: 'teach', label: 'Reciprocity', value: match.breakdown.teach },
    { key: 'affinity', label: 'Affinity', value: match.breakdown.affinity },
    { key: 'trust', label: 'Trust', value: match.breakdown.trust },
  ]

  return (
    <article className="card card-hover match-card">
      <div className="match-card-top">
        <Link to={`/u/${match.user.id}`}>
          <Avatar user={match.user} size="lg" />
        </Link>
        <div className="grow">
          <Link to={`/u/${match.user.id}`} className="person-name">
            {match.user.name}
            {match.user.verified && (
              <span className="verified-dot" title="Verified student">
                <Icon name="checkCircle" size={13} strokeWidth={2} />
              </span>
            )}
          </Link>
          <div className="person-meta">
            {match.user.branch} · {match.user.year}
          </div>
          <div style={{ marginTop: 4 }}>
            <RatingStars value={rating.average} count={rating.count} size={12} />
          </div>
        </div>
        <MatchRing score={match.score} size={56} stroke={3.5} />
      </div>

      {(match.canLearn.length > 0 || match.canTeach.length > 0) && (
        <div className="exchange">
          <div className="exchange-col">
            <span className="exchange-label teach">
              <i /> You teach
            </span>
            <div className="chip-row">
              {match.canTeach.length
                ? match.canTeach.map((skill) => (
                    <SkillChip key={skill.skillId} skillId={skill.skillId} tone="teach" />
                  ))
                : <span className="faint" style={{ fontSize: '0.76rem' }}>Nothing they want yet</span>}
            </div>
          </div>

          <span className="exchange-arrow">
            <Icon name="swap" size={15} />
          </span>

          <div className="exchange-col">
            <span className="exchange-label learn">
              <i /> You learn
            </span>
            <div className="chip-row">
              {match.canLearn.map((skill) => (
                <SkillChip key={skill.skillId} skillId={skill.skillId} tone="learn" />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="match-reason-row">
        {match.reasons.slice(0, 3).map((reason) => (
          <span key={reason} className="chip">
            <Icon name="sparkles" size={12} />
            {reason}
          </span>
        ))}
      </div>

      <div className="bars">
        {bars.map((bar) => (
          <div className="bar-row" key={bar.key}>
            <span>{bar.label}</span>
            <span className="bar-track">
              <span
                className={`bar-fill ${BAR_TONE[bar.key]}`}
                style={{ width: `${(bar.value / MATCH_WEIGHTS[bar.key]) * 100}%` }}
              />
            </span>
            <span style={{ textAlign: 'right' }}>
              {bar.value.toFixed(0)}
              <span className="faint">/{MATCH_WEIGHTS[bar.key]}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="session-actions" style={{ marginTop: 0 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setRequestOpen(true)}>
          <Icon name="calendar" size={15} />
          Request session
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(`/messages/${match.user.id}`)}
        >
          <Icon name="message" size={15} />
          Message
        </button>
        <Link to={`/u/${match.user.id}`} className="btn btn-quiet btn-sm">
          View profile
          <Icon name="arrowRight" size={14} />
        </Link>
      </div>

      <RequestSessionModal
        teacher={match.user}
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
    </article>
  )
}
