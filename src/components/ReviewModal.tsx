import { useState } from 'react'
import { addReview, getUser } from '../data/api'
import { useApp, useCurrentUser } from '../context/AppContext'
import type { Session } from '../data/types'
import { Modal } from './Modal'
import { StarPicker } from './Rating'
import { Avatar } from './Avatar'
import { Icon } from './icons'
import { useToast } from './Toast'

interface ReviewModalProps {
  session: Session
  open: boolean
  onClose: () => void
}

export function ReviewModal({ session, open, onClose }: ReviewModalProps) {
  const { db } = useApp()
  const me = useCurrentUser()
  const toast = useToast()

  const partnerId = session.teacherId === me.id ? session.learnerId : session.teacherId
  const partner = getUser(partnerId, db)
  const iTaught = session.teacherId === me.id

  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  if (!partner) return null

  const submit = async () => {
    if (posting) return
    setPosting(true)
    try {
      await addReview({
        sessionId: session.id,
        fromUserId: me.id,
        toUserId: partner.id,
        rating,
        text,
        role: iTaught ? 'learned' : 'taught',
      })
      toast('Review posted — thank you')
      setText('')
      setRating(5)
      onClose()
    } finally {
      setPosting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Review ${partner.name.split(' ')[0]}`}
      subtitle="Reviews are public and build the trust score used in matching."
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Later
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submit}
            disabled={!text.trim() || posting}
          >
            <Icon name="award" size={16} />
            Post review
          </button>
        </>
      }
    >
      <div className="stack gap-18">
        <div className="row gap-12">
          <Avatar user={partner} size="md" />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 550 }}>{partner.name}</div>
            <div className="faint" style={{ fontSize: '0.75rem' }}>
              {iTaught ? 'Learned from you' : 'Taught you'}
            </div>
          </div>
        </div>

        <div className="field">
          <span className="field-label">How was it?</span>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div className="field">
          <label htmlFor="review-text">A sentence for the next student</label>
          <textarea
            id="review-text"
            className="textarea"
            placeholder={
              iTaught
                ? 'Came prepared, asked sharp questions, and followed through on the homework.'
                : 'Explained the hard part twice without making me feel slow.'
            }
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={280}
          />
          <span className="field-hint">{text.length}/280</span>
        </div>
      </div>
    </Modal>
  )
}
