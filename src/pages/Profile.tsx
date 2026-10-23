import { useState, type CSSProperties } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp, useCurrentUser } from '../context/AppContext'
import { listReviewsForUser, ratingFor } from '../data/api'
import { scoreMatch } from '../lib/matching'
import { formatMonthYear, timeAgo } from '../lib/format'
import { Avatar } from '../components/Avatar'
import { MatchRing } from '../components/MatchRing'
import { RatingStars } from '../components/Rating'
import { SkillChip } from '../components/SkillChip'
import { RequestSessionModal } from '../components/RequestSessionModal'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/icons'

export function Profile() {
  const { userId } = useParams()
  const { db } = useApp()
  const me = useCurrentUser()
  const navigate = useNavigate()
  const [requestOpen, setRequestOpen] = useState(false)

  const person = db.users.find((candidate) => candidate.id === userId)

  if (!person) {
    return (
      <EmptyState
        icon="user"
        title="Student not found"
        text="That profile may have been removed. Browse Discover to find someone else."
        action={
          <Link to="/discover" className="btn btn-primary btn-sm">
            Back to Discover
          </Link>
        }
      />
    )
  }

  const isMe = person.id === me.id
  const match = scoreMatch(me, person, db)
  const rating = ratingFor(person.id, db)
  const reviews = listReviewsForUser(person.id, db)
  const firstName = person.name.split(' ')[0]

  const taught = db.sessions.filter(
    (session) => session.teacherId === person.id && session.status === 'completed',
  ).length
  const learned = db.sessions.filter(
    (session) => session.learnerId === person.id && session.status === 'completed',
  ).length

  return (
    <>
      <div className="profile-shell" style={{ '--h': person.hue } as CSSProperties}>
        <div className="profile-cover" />
        <div className="profile-body">
          <div className="profile-head">
            <Avatar user={person} size="2xl" ring />
            <div className="profile-head-main">
              <h1 className="profile-name">
                {person.name}
                {person.verified && (
                  <span className="verified-dot" title="Verified student">
                    <Icon name="shield" size={18} />
                  </span>
                )}
              </h1>
              <div className="profile-meta">
                <span>{person.branch}</span>
                <span className="dot-sep" />
                <span>{person.year}</span>
                <span className="dot-sep" />
                <span className="faint">@{person.handle}</span>
                <span className="dot-sep" />
                <RatingStars value={rating.average} count={rating.count} size={12} />
              </div>
            </div>

            <div className="profile-actions">
              {isMe ? (
                <Link to="/profile" className="btn btn-primary">
                  <Icon name="edit" size={16} />
                  Edit profile
                </Link>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={() => setRequestOpen(true)}>
                    <Icon name="calendar" size={16} />
                    Request session
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate(`/messages/${person.id}`)}
                  >
                    <Icon name="message" size={16} />
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="profile-bio">{person.bio}</p>

          <div className="profile-skills" style={{ marginTop: 18 }}>
            <div className="skill-panel">
              <div className="skill-panel-head teach">
                <i className="dot-sep" style={{ background: 'var(--ember)' }} />
                Can teach
              </div>
              <div className="chip-row">
                {person.teaches.length ? (
                  person.teaches.map((skill) => (
                    <SkillChip
                      key={skill.skillId}
                      skillId={skill.skillId}
                      level={skill.level}
                      tone="teach"
                      large
                    />
                  ))
                ) : (
                  <span className="faint" style={{ fontSize: '0.8rem' }}>
                    Nothing listed yet.
                  </span>
                )}
              </div>
            </div>

            <div className="skill-panel">
              <div className="skill-panel-head learn">
                <i className="dot-sep" style={{ background: 'var(--mint)' }} />
                Wants to learn
              </div>
              <div className="chip-row">
                {person.wants.length ? (
                  person.wants.map((skill) => (
                    <SkillChip
                      key={skill.skillId}
                      skillId={skill.skillId}
                      level={skill.level}
                      tone="learn"
                      large
                    />
                  ))
                ) : (
                  <span className="faint" style={{ fontSize: '0.8rem' }}>
                    Nothing listed yet.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-layout" style={{ marginTop: 20 }}>
        <section>
          <div className="section-head">
            <h2 className="section-title">
              Reviews {rating.count > 0 && <span className="faint">({rating.count})</span>}
            </h2>
            {rating.count > 0 && <RatingStars value={rating.average} count={rating.count} size={12} />}
          </div>

          {reviews.length === 0 ? (
            <EmptyState
              icon="award"
              title="No reviews yet"
              text={`${firstName} has not completed an exchange yet. Be the first to trade skills.`}
            />
          ) : (
            <div className="card">
              <div className="review-list">
                {reviews.map((review) => {
                  const author = db.users.find((candidate) => candidate.id === review.fromUserId)
                  if (!author) return null
                  return (
                    <article className="review" key={review.id}>
                      <div className="review-head">
                        <Avatar user={author} size="sm" />
                        <div className="grow">
                          <div className="review-name">{author.name}</div>
                          <div className="review-role">
                            {review.role === 'taught' ? 'Learned from them' : 'Taught them'} ·{' '}
                            {timeAgo(review.createdAt)}
                          </div>
                        </div>
                        <RatingStars value={review.rating} count={0} size={12} showCount={false} />
                      </div>
                      <p className="review-text">{review.text}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <aside className="stack gap-14">
          {!isMe && (
            <div className="card">
              <div className="row between gap-10" style={{ marginBottom: 14 }}>
                <div>
                  <div className="eyebrow">Your match</div>
                  <div className="section-title" style={{ fontSize: '1.25rem', marginTop: 4 }}>
                    {match.score}% fit
                  </div>
                </div>
                <MatchRing score={match.score} size={52} />
              </div>

              <div className="stack gap-10">
                <div className="exchange" style={{ gridTemplateColumns: '1fr', padding: 12 }}>
                  <div className="exchange-col">
                    <span className="exchange-label teach">
                      <i /> You teach
                    </span>
                    <div className="chip-row">
                      {match.canTeach.length ? (
                        match.canTeach.map((skill) => (
                          <SkillChip key={skill.skillId} skillId={skill.skillId} tone="teach" />
                        ))
                      ) : (
                        <span className="faint" style={{ fontSize: '0.76rem' }}>
                          Nothing they want yet
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="exchange-col" style={{ marginTop: 8 }}>
                    <span className="exchange-label learn">
                      <i /> You learn
                    </span>
                    <div className="chip-row">
                      {match.canLearn.length ? (
                        match.canLearn.map((skill) => (
                          <SkillChip key={skill.skillId} skillId={skill.skillId} tone="learn" />
                        ))
                      ) : (
                        <span className="faint" style={{ fontSize: '0.76rem' }}>
                          Nothing on your wishlist
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {match.reasons.map((reason) => (
                  <div key={reason} className="row gap-6 faint" style={{ fontSize: '0.78rem', alignItems: 'flex-start' }}>
                    <Icon name="sparkles" size={13} />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card card-flat">
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              Details
            </div>
            <div className="stack gap-12">
              <div className="kv">
                <span className="kv-label">Availability</span>
                <div className="chip-row" style={{ marginTop: 4 }}>
                  {person.availability.map((slot) => (
                    <span key={slot} className="chip">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
              <div className="kv">
                <span className="kv-label">Prefers</span>
                <span className="kv-value">{person.format}</span>
              </div>
              <div className="kv">
                <span className="kv-label">Exchanges</span>
                <span className="kv-value">
                  {taught} taught · {learned} learned
                </span>
              </div>
              <div className="kv">
                <span className="kv-label">Member since</span>
                <span className="kv-value">{formatMonthYear(person.joinedAt)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {!isMe && (
        <RequestSessionModal teacher={person} open={requestOpen} onClose={() => setRequestOpen(false)} />
      )}
    </>
  )
}
