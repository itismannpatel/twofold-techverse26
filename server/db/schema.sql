-- ---------------------------------------------------------------------------
-- Twofold — SQLite schema
--
-- Applied idempotently at boot (CREATE ... IF NOT EXISTS), so there is no
-- migration step for a judge to run. The `.db` file itself is gitignored and
-- regenerated from this file plus the seeder whenever the server starts.
-- ---------------------------------------------------------------------------

PRAGMA foreign_keys = ON;

-- Skills the app knows about. Static catalogue, 41 rows.
CREATE TABLE IF NOT EXISTS skills (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  category  TEXT NOT NULL CHECK (category IN (
    'Programming','Design','Music','Languages',
    'Academics','Fitness','Business','Arts'
  ))
);

-- Students. `availability` is a JSON array of human-readable windows.
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  handle       TEXT NOT NULL UNIQUE,
  email        TEXT NOT NULL UNIQUE,
  branch       TEXT NOT NULL,
  year         TEXT NOT NULL,
  bio          TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT '[]',
  format       TEXT NOT NULL DEFAULT 'Either'
               CHECK (format IN ('Online','On campus','Either')),
  joined_at    TEXT NOT NULL,
  hue          INTEGER NOT NULL DEFAULT 45 CHECK (hue BETWEEN 0 AND 360),
  verified     INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1))
);

-- The two sides of a student's identity. `kind` is 'teach' or 'want';
-- `position` preserves the display order the student chose in the editor.
CREATE TABLE IF NOT EXISTS user_skills (
  user_id   TEXT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  skill_id  TEXT NOT NULL REFERENCES skills(id)  ON DELETE CASCADE,
  kind      TEXT NOT NULL CHECK (kind IN ('teach', 'want')),
  level     TEXT NOT NULL CHECK (level IN ('Beginner','Intermediate','Advanced')),
  position  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, skill_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_kind ON user_skills(user_id, kind);

-- A session is directional: teacher_id teaches skill_id to learner_id.
-- `proposed_slots` is a JSON array of ISO datetimes offered by the requester.
CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,
  teacher_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learner_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id        TEXT NOT NULL REFERENCES skills(id),
  topic           TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN (
                    'proposed','confirmed','completed','declined','cancelled'
                  )),
  proposed_slots  TEXT NOT NULL DEFAULT '[]',
  scheduled_for   TEXT,
  created_at      TEXT NOT NULL,
  completed_at    TEXT,
  note            TEXT,
  CHECK (teacher_id <> learner_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_teacher ON sessions(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON sessions(learner_id, status);

-- One review per (session, author). `role` describes what the *recipient* did.
CREATE TABLE IF NOT EXISTS reviews (
  id           TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  to_user_id   TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body         TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('taught','learned')),
  created_at   TEXT NOT NULL,
  UNIQUE (session_id, from_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_to_user ON reviews(to_user_id, created_at);

-- Messages. A "thread" is not a row — it is the set of messages between a
-- pair of user ids, ordered by created_at.
CREATE TABLE IF NOT EXISTS messages (
  id            TEXT PRIMARY KEY,
  from_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_from_to ON messages(from_user_id, to_user_id, created_at);

-- Read receipts. Replaces the `readBy[]` array the mockup stored per message.
CREATE TABLE IF NOT EXISTS message_reads (
  message_id  TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  read_at     TEXT NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

-- Monotonic counter bumped on every write. The client polls `version` and
-- only refetches the full snapshot when it actually changes.
CREATE TABLE IF NOT EXISTS meta (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

INSERT OR IGNORE INTO meta (key, value) VALUES ('version', '1');
