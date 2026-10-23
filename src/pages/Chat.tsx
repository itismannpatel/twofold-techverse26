import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp, useCurrentUser } from '../context/AppContext'
import {
  getUser,
  listMessages,
  listThreads,
  markThreadRead,
  sendMessage,
} from '../data/api'
import { dayLabel, formatTime, timeAgo } from '../lib/format'
import { Avatar } from '../components/Avatar'
import { EmptyState } from '../components/EmptyState'
import { Icon } from '../components/icons'
import { useToast } from '../components/Toast'

const DEMO_REPLIES = [
  'That works for me — see you then.',
  'Perfect. I will bring the messy version of the file.',
  'Ha, yes. Let us keep it to an hour and go from there.',
  'Sounds good. Send me anything you want me to skim beforehand.',
  'Deal. I will add it to my calendar now.',
]

function useIsDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(min-width: 901px)')
    const handler = () => setDesktop(query.matches)
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  return desktop
}

export function Chat() {
  const { partnerId } = useParams()
  const { db } = useApp()
  const me = useCurrentUser()
  const navigate = useNavigate()
  const toast = useToast()
  const isDesktop = useIsDesktop()

  const threads = listThreads(me.id, db)
  const activeId = partnerId ?? (isDesktop ? threads[0]?.partnerId : undefined)
  const partner = activeId ? getUser(activeId, db) : undefined
  const messages = partner ? listMessages(me.id, partner.id, db) : []

  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Only hit the server when there is something to acknowledge.
  const hasUnread = messages.some(
    (m) => m.fromUserId === partner?.id && !m.readBy.includes(me.id),
  )

  useEffect(() => {
    if (!partner || !hasUnread) return
    void markThreadRead(me.id, partner.id)
  }, [me.id, partner?.id, hasUnread])

  useEffect(() => {
    const element = bodyRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [messages.length, activeId])

  if (!partnerId && isDesktop && threads.length > 0) {
    return <Navigate to={`/messages/${threads[0].partnerId}`} replace />
  }

  const send = async () => {
    if (!partner || !draft.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(me.id, partner.id, draft)
      setDraft('')
      toast('Message sent')
    } finally {
      setSending(false)
    }
  }

  const simulateReply = () => {
    if (!partner) return
    setTyping(true)
    const reply = DEMO_REPLIES[messages.length % DEMO_REPLIES.length]
    window.setTimeout(() => {
      void sendMessage(partner.id, me.id, reply).then(() => setTyping(false))
    }, 900)
  }

  const entries = threads.map((thread) => ({
    partnerId: thread.partnerId,
    user: getUser(thread.partnerId, db),
    lastMessage: thread.lastMessage,
    unreadCount: thread.unreadCount,
  }))

  if (partner && !entries.some((entry) => entry.partnerId === partner.id)) {
    entries.unshift({
      partnerId: partner.id,
      user: partner,
      lastMessage: null as never,
      unreadCount: 0,
    })
  }

  let lastDay = ''

  return (
    <div className={`chat${partner ? ' has-active' : ''}`}>
      <div className="thread-list">
        <div className="thread-list-head">
          <div className="row between gap-10">
            <h1 className="section-title" style={{ fontSize: '1.35rem' }}>
              Messages
            </h1>
            <span className="chip">{threads.length}</span>
          </div>
          <p className="faint" style={{ fontSize: '0.72rem', marginTop: 4 }}>
            Checks for updates every second — open a second window to chat as another student.
          </p>
        </div>

        <div className="thread-scroll">
          {entries.length === 0 ? (
            <div style={{ padding: 12 }}>
              <EmptyState
                icon="message"
                title="No conversations"
                text="Message someone from their profile and the thread starts here."
              />
            </div>
          ) : (
            entries.map((entry) => {
              if (!entry.user) return null
              const isActive = entry.partnerId === activeId
              const unread = entry.unreadCount > 0
              return (
                <button
                  key={entry.partnerId}
                  type="button"
                  className={`thread${isActive ? ' is-on' : ''}${unread ? ' is-unread' : ''}`}
                  onClick={() => navigate(`/messages/${entry.partnerId}`)}
                >
                  <Avatar user={entry.user} size="md" online />
                  <span className="thread-body">
                    <span className="thread-top">
                      <span className="thread-name">{entry.user.name}</span>
                      <span className="thread-time">
                        {entry.lastMessage ? timeAgo(entry.lastMessage.createdAt) : 'new'}
                      </span>
                    </span>
                    <span className="thread-preview">
                      {entry.lastMessage
                        ? `${entry.lastMessage.fromUserId === me.id ? 'You: ' : ''}${entry.lastMessage.body}`
                        : 'Start the conversation'}
                    </span>
                  </span>
                  {unread && <span className="badge-count">{entry.unreadCount}</span>}
                </button>
              )
            })
          )}
        </div>
      </div>

      <div className="conversation">
        {!partner ? (
          <div style={{ margin: 'auto', width: '100%', padding: 24 }}>
            <EmptyState
              icon="message"
              title="Pick a conversation"
              text="Select a thread on the left, or open a profile and hit Message."
            />
          </div>
        ) : (
          <>
            <div className="conv-head">
              <button
                type="button"
                className="icon-btn icon-btn-sm chat-back"
                onClick={() => navigate('/messages')}
                aria-label="Back to threads"
              >
                <Icon name="chevronLeft" size={15} />
              </button>
              <Link to={`/u/${partner.id}`}>
                <Avatar user={partner} size="md" online />
              </Link>
              <div className="grow" style={{ minWidth: 0 }}>
                <Link to={`/u/${partner.id}`} className="conv-head-name">
                  {partner.name}
                </Link>
                <div className="conv-head-sub">
                  {typing ? 'typing…' : `${partner.branch} · usually replies fast`}
                </div>
              </div>
              <Link to={`/u/${partner.id}`} className="btn btn-quiet btn-sm">
                Profile
                <Icon name="arrowUpRight" size={13} />
              </Link>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={simulateReply}
                title="For the demo: sends a sample reply as this student"
              >
                <Icon name="sparkles" size={13} />
                Demo reply
              </button>
            </div>

            <div className="conv-body" ref={bodyRef}>
              {messages.length === 0 && (
                <div style={{ margin: 'auto', textAlign: 'center', padding: 20 }}>
                  <p className="faint" style={{ fontSize: '0.84rem' }}>
                    No messages yet with {partner.name.split(' ')[0]}.
                  </p>
                  <p className="faint" style={{ fontSize: '0.78rem', marginTop: 4 }}>
                    Say what you want to learn and what you can offer back.
                  </p>
                </div>
              )}

              {messages.map((message) => {
                const label = dayLabel(message.createdAt)
                const showDay = label !== lastDay
                lastDay = label
                const mine = message.fromUserId === me.id
                return (
                  <Fragment key={message.id}>
                    {showDay && <div className="day-sep">{label}</div>}
                    <div className={`bubble ${mine ? 'bubble-me' : 'bubble-them'}`}>
                      {message.body}
                      <span className="bubble-time">{formatTime(message.createdAt)}</span>
                    </div>
                  </Fragment>
                )
              })}

              {typing && <div className="bubble bubble-them">…</div>}
            </div>

            <div className="composer">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    send()
                  }
                }}
                placeholder={`Message ${partner.name.split(' ')[0]}…`}
                aria-label="Message"
                rows={1}
              />
              <button
                type="button"
                className="send-btn"
                onClick={() => void send()}
                disabled={!draft.trim() || sending}
                aria-label="Send message"
              >
                <Icon name="send" size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
