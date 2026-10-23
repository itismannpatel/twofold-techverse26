import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, useCurrentUser } from '../context/AppContext'
import { listSessionsForUser } from '../data/api'
import { SessionCard } from '../components/SessionCard'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/icons'

type Tab = 'upcoming' | 'requests' | 'completed' | 'closed'

export function Sessions() {
  const { db } = useApp()
  const me = useCurrentUser()
  const all = listSessionsForUser(me.id, db)

  const upcoming = all
    .filter((session) => session.status === 'confirmed')
    .sort((a, b) => (a.scheduledFor ?? '').localeCompare(b.scheduledFor ?? ''))
  const requests = all.filter((session) => session.status === 'proposed')
  const completed = all
    .filter((session) => session.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const closed = all.filter(
    (session) => session.status === 'declined' || session.status === 'cancelled',
  )

  const [tab, setTab] = useState<Tab>(requests.length ? 'requests' : 'upcoming')

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { id: 'requests', label: 'Requests', count: requests.length },
    { id: 'completed', label: 'Completed', count: completed.length },
    { id: 'closed', label: 'Closed', count: closed.length },
  ]

  const pendingToMe = requests.filter((session) => session.teacherId === me.id).length
  const current = tab === 'upcoming' ? upcoming : tab === 'requests' ? requests : tab === 'completed' ? completed : closed

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p>
            Every exchange from request to review. Accept a proposed time and both sides get a
            calendar file.
          </p>
        </div>
        <div className="row gap-8">
          {pendingToMe > 0 && (
            <span className="chip chip-ember chip-lg">
              <Icon name="clock" size={14} />
              {pendingToMe} awaiting your reply
            </span>
          )}
          <Link to="/matches" className="btn btn-ghost btn-sm">
            <Icon name="sparkles" size={15} />
            Find a swap
          </Link>
        </div>
      </header>

      <div className="row between gap-12 wrap" style={{ marginBottom: 18 }}>
        <div className="segmented">
          {tabs.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={tab === entry.id ? 'is-on' : ''}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
              {entry.count > 0 && (
                <span
                  className="badge-count"
                  style={{
                    background: tab === entry.id ? 'var(--ember)' : 'rgba(255,255,255,0.12)',
                    color: tab === entry.id ? '#1a0c05' : 'var(--text-2)',
                  }}
                >
                  {entry.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {current.length === 0 ? (
        <EmptyState
          icon={tab === 'completed' ? 'award' : tab === 'requests' ? 'clock' : 'calendar'}
          title={
            tab === 'upcoming'
              ? 'Nothing booked yet'
              : tab === 'requests'
                ? 'No requests waiting'
                : tab === 'completed'
                  ? 'No completed exchanges'
                  : 'Nothing here'
          }
          text={
            tab === 'upcoming'
              ? 'Accept a request or send one from a match — confirmed sessions appear here.'
              : tab === 'requests'
                ? 'When someone asks you to teach a skill, it lands here for you to accept.'
                : tab === 'completed'
                  ? 'Once you mark a session complete it moves here so you can review each other.'
                  : 'Declined and withdrawn requests are kept here for reference.'
          }
          action={
            tab === 'completed' || tab === 'upcoming' ? (
              <Link to="/matches" className="btn btn-primary btn-sm">
                Browse your matches
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="session-list">
          {current.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </>
  )
}
