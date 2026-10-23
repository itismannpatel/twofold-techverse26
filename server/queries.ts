import type Database from 'better-sqlite3'
import type { Database as State, ExchangeSkill, Message, Review, Session, Skill, User } from '../src/data/types'

/**
 * Every SQL statement the app needs.
 *
 * Reads return the exact shapes the UI already consumes, so nothing above the
 * API seam changes. Writes run in a transaction and bump `meta.version`, which
 * is what tells a polling client its snapshot is stale.
 */

interface UserRow {
  id: string
  name: string
  handle: string
  email: string
  branch: string
  year: string
  bio: string
  availability: string
  format: 'Online' | 'On campus' | 'Either'
  joined_at: string
  hue: number
  verified: number
}

interface SkillRow {
  id: string
  name: string
  category: Skill['category']
}

interface SessionRow {
  id: string
  teacher_id: string
  learner_id: string
  skill_id: string
  topic: string
  status: Session['status']
  proposed_slots: string
  scheduled_for: string | null
  created_at: string
  completed_at: string | null
  note: string | null
}

interface ReviewRow {
  id: string
  session_id: string
  from_user_id: string
  to_user_id: string
  rating: number
  body: string
  role: Review['role']
  created_at: string
}

interface MessageRow {
  id: string
  from_user_id: string
  to_user_id: string
  body: string
  created_at: string
  read_by: string | null
}

/* ------------------------------------------------------------- hydration */

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toSkill(row: SkillRow): Skill {
  return { id: row.id, name: row.name, category: row.category }
}

function toUser(row: UserRow, teaches: ExchangeSkill[], wants: ExchangeSkill[]): User {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    email: row.email,
    branch: row.branch,
    year: row.year,
    bio: row.bio,
    teaches,
    wants,
    availability: parseJsonArray(row.availability),
    format: row.format,
    joinedAt: row.joined_at,
    hue: row.hue,
    verified: row.verified === 1,
  }
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    learnerId: row.learner_id,
    skillId: row.skill_id,
    topic: row.topic,
    status: row.status,
    proposedSlots: parseJsonArray(row.proposed_slots),
    scheduledFor: row.scheduled_for ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    note: row.note ?? undefined,
  }
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    sessionId: row.session_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    rating: row.rating,
    text: row.body,
    createdAt: row.created_at,
    role: row.role,
  }
}

/* ----------------------------------------------------------------- reads */

export function getVersion(db: Database.Database): number {
  const row = db.prepare("SELECT value FROM meta WHERE key = 'version'").get() as
    | { value: string }
    | undefined
  return row ? Number(row.value) : 0
}

export function getSkills(db: Database.Database): Skill[] {
  return (db.prepare('SELECT id, name, category FROM skills ORDER BY name').all() as SkillRow[]).map(
    toSkill,
  )
}

export function getUsers(db: Database.Database): User[] {
  const userRows = db
    .prepare('SELECT * FROM users ORDER BY name COLLATE NOCASE')
    .all() as UserRow[]

  const skillRows = db
    .prepare(
      'SELECT user_id, skill_id, kind, level, position FROM user_skills ORDER BY position',
    )
    .all() as Array<{ user_id: string; skill_id: string; kind: 'teach' | 'want'; level: ExchangeSkill['level'] }>

  const byUser = new Map<string, { teaches: ExchangeSkill[]; wants: ExchangeSkill[] }>()
  for (const row of skillRows) {
    const entry = byUser.get(row.user_id) ?? { teaches: [], wants: [] }
    entry[row.kind === 'teach' ? 'teaches' : 'wants'].push({
      skillId: row.skill_id,
      level: row.level,
    })
    byUser.set(row.user_id, entry)
  }

  return userRows.map((row) => {
    const skills = byUser.get(row.id) ?? { teaches: [], wants: [] }
    return toUser(row, skills.teaches, skills.wants)
  })
}

export function getSessions(db: Database.Database): Session[] {
  const rows = db
    .prepare('SELECT * FROM sessions ORDER BY created_at DESC')
    .all() as SessionRow[]
  return rows.map(toSession)
}

export function getReviews(db: Database.Database): Review[] {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all() as ReviewRow[]
  return rows.map(toReview)
}

/** Messages with their `readBy` arrays collapsed in from `message_reads`. */
export function getMessages(db: Database.Database): Message[] {
  const rows = db
    .prepare(
      `SELECT m.id, m.from_user_id, m.to_user_id, m.body, m.created_at,
              (SELECT GROUP_CONCAT(r.user_id) FROM message_reads r WHERE r.message_id = m.id) AS read_by
         FROM messages m
        ORDER BY m.created_at ASC`,
    )
    .all() as MessageRow[]

  return rows.map((row) => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    body: row.body,
    createdAt: row.created_at,
    readBy: row.read_by ? row.read_by.split(',') : [row.from_user_id],
  }))
}

/** The whole document the client renders from, plus the version stamp. */
export function snapshot(db: Database.Database): State {
  return {
    version: getVersion(db),
    users: getUsers(db),
    skills: getSkills(db),
    sessions: getSessions(db),
    reviews: getReviews(db),
    messages: getMessages(db),
  }
}

/* --------------------------------------------------------------- writes */

export function bumpVersion(db: Database.Database): void {
  db.prepare("UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'version'").run()
}

export interface NewUserRow {
  id: string
  name: string
  email: string
  branch: string
  year: string
  bio: string
}

export function insertUser(db: Database.Database, input: NewUserRow): void {
  db.prepare(`
    INSERT INTO users (id, name, handle, email, branch, year, bio, availability, format, joined_at, hue, verified)
    VALUES (@id, @name, @handle, @email, @branch, @year, @bio, '[]', 'Either', @joinedAt, @hue, 0)
  `).run({
    ...input,
    handle: input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.|\.$/g, '') || 'student',
    joinedAt: new Date().toISOString(),
    hue: Math.floor(Math.random() * 360),
  })
  bumpVersion(db)
}

export interface UserPatch {
  name?: string
  branch?: string
  year?: string
  bio?: string
  format?: User['format']
  availability?: string[]
  teaches?: ExchangeSkill[]
  wants?: ExchangeSkill[]
}

export function applyUserPatch(db: Database.Database, id: string, patch: UserPatch): void {
  const run = db.transaction(() => {
    const columns: Array<[keyof UserPatch, string]> = [
      ['name', 'name'],
      ['branch', 'branch'],
      ['year', 'year'],
      ['bio', 'bio'],
      ['format', 'format'],
    ]

    for (const [key, column] of columns) {
      const value = patch[key]
      if (value !== undefined) {
        db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(value as string, id)
      }
    }

    if (patch.availability !== undefined) {
      db.prepare('UPDATE users SET availability = ? WHERE id = ?').run(
        JSON.stringify(patch.availability),
        id,
      )
    }

    // Skills are replaced wholesale — the editor owns ordering and levels.
    for (const kind of ['teach', 'want'] as const) {
      const list = kind === 'teach' ? patch.teaches : patch.wants
      if (list === undefined) continue
      db.prepare('DELETE FROM user_skills WHERE user_id = ? AND kind = ?').run(id, kind)
      const insert = db.prepare(`
        INSERT OR IGNORE INTO user_skills (user_id, skill_id, kind, level, position)
        VALUES (?, ?, ?, ?, ?)
      `)
      list.forEach((skill, index) => {
        insert.run(id, skill.skillId, kind, skill.level, index)
      })
    }

    bumpVersion(db)
  })

  run()
}

export interface SessionRowInput {
  id: string
  teacherId: string
  learnerId: string
  skillId: string
  topic: string
  proposedSlots: string[]
  note?: string
}

export function insertSession(db: Database.Database, input: SessionRowInput): void {
  db.prepare(`
    INSERT INTO sessions
      (id, teacher_id, learner_id, skill_id, topic, status, proposed_slots, created_at, note)
    VALUES (?, ?, ?, ?, ?, 'proposed', ?, ?, ?)
  `).run(
    input.id,
    input.teacherId,
    input.learnerId,
    input.skillId,
    input.topic,
    JSON.stringify(input.proposedSlots),
    new Date().toISOString(),
    input.note ?? null,
  )
  bumpVersion(db)
}

export function setSessionStatus(
  db: Database.Database,
  id: string,
  status: Session['status'],
  scheduledFor?: string,
): void {
  if (status === 'completed') {
    db.prepare(
      "UPDATE sessions SET status = 'completed', completed_at = ? WHERE id = ?",
    ).run(new Date().toISOString(), id)
  } else if (scheduledFor) {
    db.prepare(
      "UPDATE sessions SET status = ?, scheduled_for = ? WHERE id = ?",
    ).run(status, scheduledFor, id)
  } else {
    db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, id)
  }
  bumpVersion(db)
}

export interface ReviewRowInput {
  id: string
  sessionId: string
  fromUserId: string
  toUserId: string
  rating: number
  text: string
  role: Review['role']
}

/** No-op if this author already reviewed this session (UNIQUE constraint). */
export function insertReview(db: Database.Database, input: ReviewRowInput): void {
  const existing = db
    .prepare('SELECT 1 FROM reviews WHERE session_id = ? AND from_user_id = ?')
    .get(input.sessionId, input.fromUserId)
  if (existing) return

  db.prepare(`
    INSERT INTO reviews (id, session_id, from_user_id, to_user_id, rating, body, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.sessionId,
    input.fromUserId,
    input.toUserId,
    input.rating,
    input.text,
    input.role,
    new Date().toISOString(),
  )
  bumpVersion(db)
}

export function insertMessage(
  db: Database.Database,
  id: string,
  fromUserId: string,
  toUserId: string,
  body: string,
): void {
  const now = new Date().toISOString()
  const run = db.transaction(() => {
    db.prepare(
      'INSERT INTO messages (id, from_user_id, to_user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, fromUserId, toUserId, body, now)
    // The sender has, by definition, read their own message.
    db.prepare(
      'INSERT INTO message_reads (message_id, user_id, read_at) VALUES (?, ?, ?)',
    ).run(id, fromUserId, now)
    bumpVersion(db)
  })
  run()
}

export function markThreadRead(
  db: Database.Database,
  userId: string,
  partnerId: string,
): void {
  const run = db.transaction(() => {
    const now = new Date().toISOString()
    const unread = db
      .prepare(
        `SELECT id FROM messages
          WHERE from_user_id = ? AND to_user_id = ?`,
      )
      .all(partnerId, userId) as Array<{ id: string }>

    const insert = db.prepare(
      'INSERT OR IGNORE INTO message_reads (message_id, user_id, read_at) VALUES (?, ?, ?)',
    )

    let changed = 0
    for (const message of unread) {
      const result = insert.run(message.id, userId, now)
      changed += result.changes
    }
    if (changed > 0) bumpVersion(db)
  })
  run()
}
