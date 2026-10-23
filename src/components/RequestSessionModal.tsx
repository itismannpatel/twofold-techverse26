import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { requestSession } from '../data/api'
import { useCurrentUser } from '../context/AppContext'
import type { User } from '../data/types'
import { formatDay, formatTime } from '../lib/format'
import { SKILL_BY_ID } from '../data/catalog'
import { Modal } from './Modal'
import { Icon } from './icons'
import { useToast } from './Toast'

interface RequestSessionModalProps {
  teacher: User
  open: boolean
  onClose: () => void
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultSlots(): string[] {
  const base = new Date()
  base.setSeconds(0, 0)
  return [1, 2, 4].map((offset) => {
    const slot = new Date(base)
    slot.setDate(base.getDate() + offset)
    slot.setHours(17, 0, 0, 0)
    return toLocalInput(slot)
  })
}

export function RequestSessionModal({ teacher, open, onClose }: RequestSessionModalProps) {
  const me = useCurrentUser()
  const toast = useToast()
  const navigate = useNavigate()

  const preferredSkill = useMemo(() => {
    const wanted = new Set(me.wants.map((skill) => skill.skillId))
    return teacher.teaches.find((skill) => wanted.has(skill.skillId))?.skillId ?? teacher.teaches[0]?.skillId ?? ''
  }, [me.wants, teacher.teaches])

  const [skillId, setSkillId] = useState(preferredSkill)
  const [topic, setTopic] = useState('')
  const [note, setNote] = useState('')
  const [slots, setSlots] = useState<string[]>(defaultSlots)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (sending) return
    if (!skillId) {
      setError('Pick a skill to trade.')
      return
    }
    if (!topic.trim()) {
      setError('Add a short topic so they know what to prepare.')
      return
    }
    const chosen = slots.filter(Boolean)
    if (!chosen.length) {
      setError('Offer at least one time slot.')
      return
    }

    setSending(true)
    try {
      await requestSession({
        teacherId: teacher.id,
        learnerId: me.id,
        skillId,
        topic: topic.trim(),
        note: note.trim() || undefined,
        proposedSlots: chosen.map((slot) => new Date(slot).toISOString()),
      })

      toast(`Session request sent to ${teacher.name.split(' ')[0]}`)
      setTopic('')
      setNote('')
      setSlots(defaultSlots())
      onClose()
      navigate('/sessions')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request a session"
      subtitle={`Offer ${teacher.name.split(' ')[0]} a time — they confirm one slot.`}
      wide
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={sending}
          >
            <Icon name="calendar" size={16} />
            {sending ? 'Sending…' : 'Send request'}
          </button>
        </>
      }
    >
      <div className="stack gap-16">
        <div className="field">
          <label htmlFor="request-skill">What do you want to learn?</label>
          <select
            id="request-skill"
            className="select"
            value={skillId}
            onChange={(event) => setSkillId(event.target.value)}
          >
            {teacher.teaches.map((skill) => (
              <option key={skill.skillId} value={skill.skillId}>
                {SKILL_BY_ID[skill.skillId]?.name ?? skill.skillId} · {skill.level}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="request-topic">Topic</label>
          <input
            id="request-topic"
            className="input"
            placeholder="e.g. Components and auto-layout for my portfolio"
            value={topic}
            maxLength={90}
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>

        <div className="field">
          <span className="field-label">Propose up to three times</span>
          <div className="stack gap-8">
            {slots.map((slot, index) => (
              <div key={index} className="row gap-8">
                <input
                  type="datetime-local"
                  className="input"
                  value={slot}
                  onChange={(event) => {
                    const next = [...slots]
                    next[index] = event.target.value
                    setSlots(next)
                  }}
                />
                {slot && (
                  <span className="faint" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', minWidth: 96 }}>
                    {formatDay(slot)} · {formatTime(slot)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <span className="field-hint">They pick one and it lands on both calendars.</span>
        </div>

        <div className="field">
          <label htmlFor="request-note">Note (optional)</label>
          <textarea
            id="request-note"
            className="textarea"
            style={{ minHeight: 74 }}
            placeholder="Where are you stuck? What should they bring?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        {error && (
          <div className="row gap-6" style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>
            <Icon name="x" size={14} />
            {error}
          </div>
        )}
      </div>
    </Modal>
  )
}
