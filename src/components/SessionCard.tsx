import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Session } from '../data/types'
import {
  acceptSession,
  cancelSession,
  completeSession,
  declineSession,
  getSkill,
  getUser,
  hasReviewed,
} from '../data/api'
import { useApp, useCurrentUser } from '../context/AppContext'
import { formatDay, formatTime } from '../lib/format'
import { buildIcs, downloadIcs } from '../lib/ics'
import { Avatar } from './Avatar'
import { SkillChip } from './SkillChip'
import { ReviewModal } from './ReviewModal'
import { Icon } from './icons'
import { useToast } from './Toast'

export function SessionCard({ session }: { session: Session }) {
  const { db } = useApp()
  const me = useCurrentUser()
  const toast = useToast()
  const navigate = useNavigate()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const iTeach = session.teacherId === me.id
  const partnerId = iTeach ? session.learnerId : session.teacherId
  const partner = getUser(partnerId, db)
  const skill = getSkill(session.skillId, db)
  const reviewed = hasReviewed(session.id, me.id, db)

  if (!partner || !skill) return null

  const when = session.scheduledFor ? new Date(session.scheduledFor) : null
  const firstName = partner.name.split(' ')[0]
  const isProposedToMe = session.status === 'proposed' && iTeach

  /** Runs a write, then toasts only once the server has confirmed it. */
  const run = async (action: () => Promise<void>, message: string) => {
    if (busy) return
    setBusy(true)
    try {
      await action()
      toast(message)
    } finally {
      setBusy(false)
    }
  }

  const addToCalendar = () => {
    if (!session.scheduledFor) return
    const ics = buildIcs({
      uid: session.id,
      title: `Twofold · ${skill.name} with ${partner.name}`,
      description: `${session.topic}\n\nSkill exchange arranged on Twofold.`,
      location: 'Twofold · online or on campus',
      start: session.scheduledFor,
      durationMinutes: 60,
      organizerName: me.name,
      attendeeName: partner.name,
    })
    downloadIcs(`twofold-${skill.name.toLowerCase().replace(/\s+/g, '-')}.ics`, ics)
    toast('Calendar file downloaded')
  }

  return (
    <article className="card session-card">
      <div className="session-when">
        <div className="session-when-day">{when ? when.getDate() : '—'}</div>
        <div className="session-when-month">
          {when
            ? when.toLocaleDateString(undefined, { month: 'short' })
            : session.status === 'proposed'
              ? 'TBD'
              : 'Closed'}
        </div>
        <div className="session-when-time">{when ? formatTime(session.scheduledFor!) : 'No time'}</div>
      </div>

      <div className="session-main">
        <div className="row between gap-12" style={{ alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div className="session-title">{session.topic}</div>
            <div className="session-sub">
              <SkillChip skillId={session.skillId} tone={iTeach ? 'teach' : 'learn'} />
              <span className="dot-sep" />
              <Link to={`/u/${partner.id}`} className="row gap-6">
                <Avatar user={partner} size="sm" />
                {iTeach ? `Teaching ${firstName}` : `Learning from ${firstName}`}
              </Link>
            </div>
          </div>
          <span className={`pill pill-${session.status}`}>{session.status}</span>
        </div>

        {session.note && (
          <p className="faint" style={{ fontSize: '0.8rem', marginTop: 10, fontStyle: 'italic' }}>
            “{session.note}”
          </p>
        )}

        {isProposedToMe && (
          <>
            <div className="slot-list" style={{ marginTop: 14 }}>
              {session.proposedSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className="slot"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => acceptSession(session.id, slot),
                      `Confirmed for ${formatDay(slot)} at ${formatTime(slot)}`,
                    )
                  }
                >
                  <span className="row gap-8">
                    <Icon name="calendar" size={15} />
                    {formatDay(slot)} · {formatTime(slot)}
                  </span>
                  <span className="row gap-4" style={{ color: 'var(--ember)', fontSize: '0.78rem' }}>
                    Accept
                    <Icon name="check" size={14} />
                  </span>
                </button>
              ))}
            </div>
            <div className="session-actions">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={busy}
                onClick={() => run(() => declineSession(session.id), 'Request declined')}
              >
                Decline request
              </button>
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={() => navigate(`/messages/${partner.id}`)}
              >
                <Icon name="message" size={14} />
                Discuss first
              </button>
            </div>
          </>
        )}

        {session.status === 'proposed' && !iTeach && (
          <div className="session-actions">
            <span className="faint row gap-6" style={{ fontSize: '0.79rem' }}>
              <Icon name="clock" size={14} />
              Waiting for {firstName} to confirm one of {session.proposedSlots.length} times
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={busy}
              onClick={() => run(() => cancelSession(session.id), 'Request withdrawn')}
            >
              <Icon name="x" size={13} />
              Withdraw
            </button>
          </div>
        )}

        {session.status === 'confirmed' && (
          <div className="session-actions">
            <button type="button" className="btn btn-soft btn-sm" onClick={addToCalendar}>
              <Icon name="download" size={14} />
              Add to calendar
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/messages/${partner.id}`)}
            >
              <Icon name="message" size={14} />
              Message
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              disabled={busy}
              onClick={() => run(() => completeSession(session.id), 'Session marked complete')}
            >
              <Icon name="check" size={14} />
              Mark complete
            </button>
          </div>
        )}

        {session.status === 'completed' && (
          <div className="session-actions">
            {reviewed ? (
              <span className="chip chip-mint">
                <Icon name="checkCircle" size={13} />
                Review posted
              </span>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setReviewOpen(true)}>
                <Icon name="award" size={14} />
                Leave a review
              </button>
            )}
            <Link to={`/u/${partner.id}`} className="btn btn-quiet btn-sm">
              View profile
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        )}
      </div>

      <ReviewModal session={session} open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </article>
  )
}
