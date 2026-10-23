# SQLite data model

The source schema is [`server/db/schema.sql`](../server/db/schema.sql), with
row mapping and queries in `server/queries.ts`. SQLite is the default runtime
store. The ignored database is `server/db/twofold.db`; it is created and seeded
by `server/db.ts` when the API first opens it for each server process. There is
no committed binary database, ORM, code generation, or manual migration step.

The browser identity picker is separate from shared app data. It stores the
selected demo user ID in `localStorage` as `twofold.auth.v1`; this is not real
authentication.

## Tables

| Table | Purpose | Important constraints |
|---|---|---|
| `users` | Student profile and meeting preferences | Unique ID, handle, and email; format and hue checks |
| `skills` | Static catalog of 41 skills in 8 categories | Unique ID and name; category check |
| `user_skills` | Skills a student teaches or wants to learn | `(user_id, skill_id, kind)` primary key; `kind` is `teach` or `want`; stores level and display position |
| `sessions` | Directional skill exchange appointment | User and skill foreign keys; checked status; teacher and learner must differ |
| `reviews` | Rating attached to a session and recipient | Rating 1–5; one review per `(session_id, from_user_id)` |
| `messages` | Message body, sender, recipient, timestamp | User foreign keys |
| `message_reads` | Per-user read receipts | `(message_id, user_id)` primary key |
| `meta` | Monotonic snapshot version | `key='version'` is incremented after writes |

SQLite columns are snake_case. The API hydrates the frontend's camelCase domain
types: `users.teaches` and `users.wants` come from `user_skills`,
`sessions.proposedSlots` is decoded from JSON text, and `messages.readBy` is
assembled from `message_reads`.

## Relationships and lifecycle

- `user_skills.user_id` references `users.id`; `skill_id` references `skills.id`.
- Each session has a teacher, learner, skill, one or more proposed ISO datetime
  slots, a status, and an optional accepted `scheduled_for` value.
- Session status moves through `proposed` to `confirmed` and then `completed`,
  or can end as `declined` or `cancelled`.
- Reviews reference a session, author, and recipient. The unique constraint
  prevents an author from reviewing the same session twice.
- Message threads are implicit pairs of users. `message_reads` replaces the old
  per-message `readBy` array and supports unread counts.
- Ratings, match scores, unread totals, and pending request counts are derived
  from these rows rather than stored separately.

## Snapshot shape

`GET /api/state` returns a full `Database` snapshot with a monotonic numeric
`version`, `users`, `skills`, `sessions`, `reviews`, and `messages`. The browser
polls once per second and only applies a snapshot when its version changes.
Writes return the updated snapshot immediately. See [API.md](API.md) for the
endpoint contract.

## Seed and reset behavior

`server/seed.ts` holds the demo rows and computes relative timestamps in
JavaScript from server startup. Every new server process restores the seed so
dates such as "in 3 days" remain useful and every demo begins consistently.
The current seed contains 12 users, 41 skills, 12 sessions, 14 reviews, and 9
messages. The `/api/reset` endpoint restores it during a run; `npm run db:reset`
deletes the local database and its WAL files so the next server start creates a
fresh one.

Schema changes belong in `server/db/schema.sql`. `better-sqlite3` applies the
idempotent `CREATE TABLE/INDEX IF NOT EXISTS` schema at startup. Keep SQL source
and JavaScript seed data in the repository; keep `twofold.db`, `twofold.db-wal`,
and `twofold.db-shm` out of version control.
