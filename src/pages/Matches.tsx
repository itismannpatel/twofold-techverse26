import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useCurrentUser } from '../context/AppContext'
import { computeMatches, MATCH_WEIGHTS } from '../lib/matching'
import { MatchCard } from '../components/MatchCard'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/icons'

export function Matches() {
  const { db } = useApp()
  const me = useCurrentUser()

  const matches = useMemo(() => computeMatches(me, db), [me, db])
  const twoWay = matches.filter((match) => match.reciprocal)
  const oneWay = matches.filter((match) => !match.reciprocal)
  const best = matches[0]

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Your matches</h1>
          <p>
            Ranked by how much you both gain. A two-way swap means there is something in it for each
            of you — those come first.
          </p>
        </div>
        <Link to="/discover" className="btn btn-ghost btn-sm">
          <Icon name="compass" size={15} />
          Browse everyone
        </Link>
      </header>

      <div className="card card-glow" style={{ marginBottom: 22 }}>
        <div className="row between gap-16 wrap">
          <div className="row gap-14">
            <span className="feature-icon" style={{ margin: 0 }}>
              <Icon name="sparkles" size={18} />
            </span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {twoWay.length} two-way swaps available
              </div>
              <div className="faint" style={{ fontSize: '0.78rem', marginTop: 2 }}>
                {best
                  ? `Your strongest match is ${best.user.name.split(' ')[0]} at ${best.score}%.`
                  : 'Add skills to your profile to unlock matches.'}
              </div>
            </div>
          </div>

          <div className="score-legend">
            <span>
              <strong style={{ color: 'var(--ember)' }}>Learn {MATCH_WEIGHTS.learn}</strong> what they
              teach you
            </span>
            <span>
              <strong style={{ color: 'var(--mint)' }}>Reciprocity {MATCH_WEIGHTS.teach}</strong> what
              you teach them
            </span>
            <span>
              <strong style={{ color: 'var(--gold)' }}>Affinity {MATCH_WEIGHTS.affinity}</strong> shared
              subjects
            </span>
            <span>
              <strong style={{ color: 'var(--text-2)' }}>Trust {MATCH_WEIGHTS.trust}</strong> review
              history
            </span>
          </div>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon="target"
          title="No matches yet"
          text="Tell Twofold what you want to learn — every student who can teach it will show up here, ranked."
          action={
            <Link to="/profile" className="btn btn-primary btn-sm">
              Add skills to my profile
            </Link>
          }
        />
      ) : (
        <>
          {twoWay.length > 0 && (
            <section>
              <div className="section-head">
                <h2 className="section-title">Two-way swaps</h2>
                <p>You both walk away with something new.</p>
              </div>
              <div className="match-list">
                {twoWay.map((match) => (
                  <MatchCard key={match.user.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {oneWay.length > 0 && (
            <section className={twoWay.length ? 'section' : ''}>
              <div className="section-head">
                <h2 className="section-title">They have what you want</h2>
                <p>One-way for now — settle up in another skill or a coffee.</p>
              </div>
              <div className="match-list">
                {oneWay.map((match) => (
                  <MatchCard key={match.user.id} match={match} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}
