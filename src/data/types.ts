/**
 * Twofold — core domain types.
 *
 * These mirror the SQLite tables described in `server/db/schema.sql` and
 * docs/DATA_MODEL.md. The server hydrates them and ships a whole `Database`
 * document to the client, which is what makes the reads above the API seam
 * pure, synchronous functions.
 */

export type Level = 'Beginner' | 'Intermediate' | 'Advanced'

export const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced']

export type Category =
  | 'Programming'
  | 'Design'
  | 'Music'
  | 'Languages'
  | 'Academics'
  | 'Fitness'
  | 'Business'
  | 'Arts'

/** A skill in the shared catalog. */
export interface Skill {
  id: string
  name: string
  category: Category
}

/** A skill plus the holder's proficiency (teach) or target level (want). */
export interface ExchangeSkill {
  skillId: string
  level: Level
}

export interface User {
  id: string
  name: string
  handle: string
  email: string
  branch: string
  year: string
  bio: string
  /** Skills this student can teach. */
  teaches: ExchangeSkill[]
  /** Skills this student wants to learn. */
  wants: ExchangeSkill[]
  /** Human-readable availability windows, e.g. "Weekday evenings". */
  availability: string[]
  format: 'Online' | 'On campus' | 'Either'
  joinedAt: string
  /** Hue (0-360) used to generate this student's deterministic avatar. */
  hue: number
  /** Seed accounts are pre-verified for the demo. */
  verified: boolean
}

export type SessionStatus = 'proposed' | 'confirmed' | 'completed' | 'declined' | 'cancelled'

export interface Session {
  id: string
  /** The student sharing the skill. */
  teacherId: string
  /** The student receiving the skill. */
  learnerId: string
  skillId: string
  topic: string
  status: SessionStatus
  /** ISO datetimes offered by the requester. */
  proposedSlots: string[]
  /** ISO datetime once both sides agree. */
  scheduledFor?: string
  createdAt: string
  completedAt?: string
  /** Optional message attached to the request. */
  note?: string
}

export type ReviewRole = 'taught' | 'learned'

export interface Review {
  id: string
  sessionId: string
  fromUserId: string
  toUserId: string
  /** 1-5 stars. */
  rating: number
  text: string
  createdAt: string
  /** What the *recipient* did in the session. */
  role: ReviewRole
}

export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  body: string
  createdAt: string
  /** User ids that have read this message. */
  readBy: string[]
}

/**
 * The whole server snapshot the client renders from.
 *
 * `version` is a monotonic counter the server bumps on every write; the client
 * uses it to decide whether a polled response is worth re-rendering for.
 */
export interface Database {
  version: number
  users: User[]
  skills: Skill[]
  sessions: Session[]
  reviews: Review[]
  messages: Message[]
}

export interface RatingSummary {
  average: number
  count: number
}
