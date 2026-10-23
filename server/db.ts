import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { SKILLS, SEED_MESSAGES, SEED_REVIEWS, SEED_SESSIONS, SEED_USERS } from './seed.js'

/**
 * Database bootstrap.
 *
 * The `.db` file is gitignored. On every process boot we apply `schema.sql`
 * (idempotently) and restore the demo seed. This keeps relative demo dates
 * fresh and gives every judge a clean, predictable starting dataset.
 *
 * DB and schema paths are resolved relative to this module's location, not to
 * `process.cwd()`. The old `cwd`-based code was fragile: any process that
 * started with its cwd inside `server/`, `dist/`, or elsewhere would resolve
 * the database to a different file than the seeded one, which produced the
 * "threads started with 12 users but version 0 / empty meta / reseeding every
 * request" symptoms. Deriving paths from the module itself makes the path
 * stable regardless of how Vite, `npm run dev`, or a standalone script starts
 * the process.
 *
 * We still allow `TWOFOLD_DB` to override the path (used by tests) and to
 * point at an in-memory database (`:memory:`).
 */

const THIS_DIR = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(THIS_DIR, '..')

const DB_DIR = join(PROJECT_ROOT, 'server', 'db')
const DB_FILE = join(DB_DIR, 'twofold.db')
const SCHEMA_FILE = join(DB_DIR, 'schema.sql')

/** Allow `TWOFOLD_DB` to point at an in-memory database (used by tests). */
const DB_PATH = process.env.TWOFOLD_DB ?? DB_FILE

let instance: Database.Database | null = null

function loadSchema(db: Database.Database): void {
  const sql = readFileSync(SCHEMA_FILE, 'utf8')
  db.exec(sql)
}

function seedDatabase(db: Database.Database, reset = false): void {
  const now = new Date().toISOString()

  const run = db.transaction(() => {
    if (reset) {
      db.exec(`
        DELETE FROM message_reads;
        DELETE FROM messages;
        DELETE FROM reviews;
        DELETE FROM sessions;
        DELETE FROM user_skills;
        DELETE FROM users;
        DELETE FROM skills;
      `)
    }

    for (const skill of SKILLS) {
      db.prepare(
        'INSERT OR IGNORE INTO skills (id, name, category) VALUES (?, ?, ?)',
      ).run(skill.id, skill.name, skill.category)
    }

    const insertUser = db.prepare(`
      INSERT INTO users
        (id, name, handle, email, branch, year, bio, availability, format, joined_at, hue, verified)
      VALUES
        (@id, @name, @handle, @email, @branch, @year, @bio, @availability, @format, @joinedAt, @hue, @verified)
    `)

    const insertUserSkill = db.prepare(`
      INSERT OR IGNORE INTO user_skills (user_id, skill_id, kind, level, position)
      VALUES (@userId, @skillId, @kind, @level, @position)
    `)

    for (const user of SEED_USERS) {
      insertUser.run({
        id: user.id,
        name: user.name,
        handle: user.handle,
        email: user.email,
        branch: user.branch,
        year: user.year,
        bio: user.bio,
        availability: JSON.stringify(user.availability),
        format: user.format,
        joinedAt: user.joinedAt,
        hue: user.hue,
        verified: user.verified ? 1 : 0,
      })

      user.teaches.forEach((skill, index) => {
        insertUserSkill.run({
          userId: user.id,
          skillId: skill.skillId,
          kind: 'teach',
          level: skill.level,
          position: index,
        })
      })

      user.wants.forEach((skill, index) => {
        insertUserSkill.run({
          userId: user.id,
          skillId: skill.skillId,
          kind: 'want',
          level: skill.level,
          position: index,
        })
      })
    }

    const insertSession = db.prepare(`
      INSERT INTO sessions
        (id, teacher_id, learner_id, skill_id, topic, status, proposed_slots,
         scheduled_for, created_at, completed_at, note)
      VALUES
        (@id, @teacherId, @learnerId, @skillId, @topic, @status, @proposedSlots,
         @scheduledFor, @createdAt, @completedAt, @note)
    `)

    for (const session of SEED_SESSIONS) {
      insertSession.run({
        id: session.id,
        teacherId: session.teacherId,
        learnerId: session.learnerId,
        skillId: session.skillId,
        topic: session.topic,
        status: session.status,
        proposedSlots: JSON.stringify(session.proposedSlots),
        scheduledFor: session.scheduledFor ?? null,
        createdAt: session.createdAt,
        completedAt: session.completedAt ?? null,
        note: session.note ?? null,
      })
    }

    const insertReview = db.prepare(`
      INSERT INTO reviews (id, session_id, from_user_id, to_user_id, rating, body, role, created_at)
      VALUES (@id, @sessionId, @fromUserId, @toUserId, @rating, @text, @role, @createdAt)
    `)

    for (const review of SEED_REVIEWS) {
      insertReview.run(review)
    }

    const insertMessage = db.prepare(`
      INSERT INTO messages (id, from_user_id, to_user_id, body, created_at)
      VALUES (@id, @fromUserId, @toUserId, @body, @createdAt)
    `)

    const insertRead = db.prepare(`
      INSERT OR IGNORE INTO message_reads (message_id, user_id, read_at)
      VALUES (?, ?, ?)
    `)

    for (const message of SEED_MESSAGES) {
      insertMessage.run(message)
      for (const userId of message.readBy) insertRead.run(message.id, userId, now)
    }

    db.prepare("UPDATE meta SET value = CAST(value AS INTEGER) + 1 WHERE key = 'version'").run()
  })

  run()
}

export function getDb(): Database.Database {
  if (instance) return instance

  const inMemory = DB_PATH === ':memory:'
  if (!inMemory) {
    const dir = dirname(DB_PATH)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }

  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  loadSchema(db)
  seedDatabase(db, true)

  instance = db
  return db
}

/** Drop every row and reseed. Used by the Reset button and `npm run db:reset`. */
export function reseed(): void {
  const db = getDb()
  seedDatabase(db, true)
}
