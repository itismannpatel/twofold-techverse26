# HTTP API

Twofold's React client talks to a JSON API mounted inside Vite's Connect server.
`npm run dev` and `npm run preview` each run the frontend and API in one process
on one port. There is no proxy, CORS setup, or second server.

The implementation is in `server/api.ts`; Vite wiring is in
`server/vite-plugin.ts`. `src/data/api.ts` is the UI's data access seam, and
`src/data/store.ts` owns the HTTP snapshot cache and polling. Client reads are
synchronous over the latest snapshot; writes return promises and apply the
server's returned snapshot immediately. Other tabs pick up changes through
one-second polling while visible.

## Snapshot

### `GET /api/state`

Returns the complete client state:

```ts
interface Database {
  version: number
  users: User[]       // teaches and wants hydrated from user_skills
  skills: Skill[]
  sessions: Session[]
  reviews: Review[]
  messages: Message[] // readBy hydrated from message_reads
}
```

`version` increases after writes. A polling client skips a re-render when the
version is unchanged. Dates are ISO 8601 strings. The snapshot uses camelCase
domain objects even though SQLite columns use snake_case.

## Endpoints

All mutation requests send JSON. Successful writes return the updated snapshot;
creates respond with `201`, other writes with `200`.

| Method and path | Body | Effect |
|---|---|---|
| `POST /api/users` | `{ name, email, branch?, year?, bio? }` | Create a student with empty teach/want lists |
| `PATCH /api/users/:id` | Any of `name`, `branch`, `year`, `bio`, `format`, `availability`, `teaches`, `wants` | Update profile fields and replace supplied skill lists |
| `POST /api/sessions` | `{ teacherId, learnerId, skillId, topic, proposedSlots, note? }` | Create a proposed session |
| `POST /api/sessions/:id/accept` | `{ slot }` | Confirm a proposed session at one offered time |
| `POST /api/sessions/:id/decline` | `{}` | Decline a proposed session |
| `POST /api/sessions/:id/cancel` | `{}` | Cancel a proposed or confirmed session |
| `POST /api/sessions/:id/complete` | `{}` | Mark a session complete |
| `POST /api/reviews` | `{ sessionId, fromUserId, toUserId, rating, text, role }` | Add one review per author and session |
| `POST /api/messages` | `{ fromUserId, toUserId, body }` | Send a non-empty message |
| `POST /api/messages/read` | `{ userId, partnerId }` | Mark the partner's messages in that thread as read |
| `POST /api/reset` | `{}` | Restore the seeded demo data |

Validation failures return `400` with `{ error }`; unsupported methods return
`405`; unknown routes return `404`. Unexpected server errors return `500` and
are logged with an API prefix. The demo API does not authenticate callers.

## Persistence and boot

`server/db/schema.sql` defines the database. `server/db.ts` resolves the SQLite
file relative to the project, applies the schema, and seeds the demo dataset
when the process opens the database. Each server process starts from a fresh
seed with timestamps generated in JavaScript at startup. The database file and
its WAL files are ignored by Git.

Stop Vite before running `npm run db:reset`; the command deletes the local
database files, and the next start recreates and seeds them. The in-app Reset demo data action performs the reset through the
API without requiring a restart. See [DATA_MODEL.md](DATA_MODEL.md) for the
tables, constraints, and seed contents.

## Client data API

Components use `src/data/api.ts`, never SQL or `fetch` directly. Its synchronous
read helpers select from the current snapshot (`listUsers`, `getUser`,
`listSessionsForUser`, `listThreads`, and others). Its async write helpers call
the endpoints above (`createUser`, `updateUser`, `requestSession`,
`acceptSession`, `addReview`, `sendMessage`, `resetDatabase`, and others).
`src/context/AppContext.tsx` starts polling and exposes the snapshot and current
demo identity through React context.

The selected identity is intentionally client-side, in `localStorage` under
`twofold.auth.v1`. It stores only the chosen demo user ID and is not an
authentication mechanism.
