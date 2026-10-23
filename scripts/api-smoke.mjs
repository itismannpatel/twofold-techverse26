/**
 * API smoke test — run against a live dev server.
 *
 *   node scripts/api-smoke.mjs [baseUrl]
 *
 * Exercises every endpoint the UI depends on and fails loudly on the first
 * problem. Not a unit test framework: deliberately dependency-free so it works
 * on a fresh clone with nothing but `npm install`.
 */

const BASE = process.argv[2] ?? 'http://localhost:5173'

let failures = 0
const ok = (label, detail = '') => console.log(`  ok   ${label}${detail ? ` — ${detail}` : ''}`)
const bad = (label, detail) => {
  failures += 1
  console.log(`  FAIL ${label} — ${detail}`)
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

const expect = (label, condition, detail) => {
  if (condition) ok(label, detail)
  else bad(label, detail ?? 'condition was false')
}

console.log(`\nTwofold API smoke test → ${BASE}\n`)

/* ------------------------------------------------------------- baseline */
const initial = await call('GET', '/api/state')
expect('GET /api/state responds', initial.status === 200, `HTTP ${initial.status}`)

const db = initial.json
expect('12 seeded users', db.users.length === 12, `got ${db.users.length}`)
expect('41 seeded skills', db.skills.length === 41, `got ${db.skills.length}`)
expect('12 seeded sessions', db.sessions.length === 12, `got ${db.sessions.length}`)
expect('14 seeded reviews', db.reviews.length === 14, `got ${db.reviews.length}`)
expect('9 seeded messages', db.messages.length === 9, `got ${db.messages.length}`)
expect(
  'every message has readBy',
  db.messages.every((m) => Array.isArray(m.readBy) && m.readBy.length > 0),
)
expect(
  'user skills hydrated',
  db.users.every((u) => u.teaches.length > 0 && u.wants.length > 0),
)
expect('version stamp present', typeof db.version === 'number', `v${db.version}`)

/* -------------------------------------------------- request → accept flow */
const requested = await call('POST', '/api/sessions', {
  teacherId: 'u_riya',
  learnerId: 'u_aarav',
  skillId: 'sk_figma',
  topic: 'Smoke test session',
  proposedSlots: ['2026-11-01T11:00:00.000Z', '2026-11-02T11:00:00.000Z'],
  note: 'created by smoke test',
})
expect('POST /api/sessions creates', requested.status === 201, `HTTP ${requested.status}`)
const created = requested.json.sessions.find((s) => s.topic === 'Smoke test session')
expect('new session is proposed', created?.status === 'proposed', created?.status)
expect('new session has both slots', created?.proposedSlots.length === 2)
expect('version bumped on write', requested.json.version > db.version)

const accepted = await call('POST', `/api/sessions/${created.id}/accept`, {
  slot: created.proposedSlots[1],
})
const acceptedSession = accepted.json.sessions.find((s) => s.id === created.id)
expect('accept confirms session', acceptedSession?.status === 'confirmed', acceptedSession?.status)
expect(
  'accept stores scheduledFor',
  acceptedSession?.scheduledFor === created.proposedSlots[1],
  acceptedSession?.scheduledFor,
)

const completed = await call('POST', `/api/sessions/${created.id}/complete`)
const doneSession = completed.json.sessions.find((s) => s.id === created.id)
expect('complete marks completed', doneSession?.status === 'completed')
expect('complete stamps completedAt', Boolean(doneSession?.completedAt))

/* --------------------------------------------------------------- reviews */
const reviewed = await call('POST', '/api/reviews', {
  sessionId: created.id,
  fromUserId: 'u_aarav',
  toUserId: 'u_riya',
  rating: 5,
  text: 'Smoke test review.',
  role: 'taught',
})
expect('POST /api/reviews succeeds', reviewed.status === 201, `HTTP ${reviewed.status}`)
expect('review count grew', reviewed.json.reviews.length === 15, `${reviewed.json.reviews.length}`)

const dup = await call('POST', '/api/reviews', {
  sessionId: created.id,
  fromUserId: 'u_aarav',
  toUserId: 'u_riya',
  rating: 1,
  text: 'Should be ignored.',
  role: 'taught',
})
expect('duplicate review ignored', dup.json.reviews.length === 15, `${dup.json.reviews.length}`)

const rating = reviewed.json.reviews.filter((r) => r.toUserId === 'u_riya')
expect(
  'new review lands on riya profile',
  rating.some((r) => r.fromUserId === 'u_aarav' && r.text === 'Smoke test review.'),
  `${rating.length} reviews for u_riya`,
)

/* ------------------------------------------------------------- messaging */
const sent = await call('POST', '/api/messages', {
  fromUserId: 'u_aarav',
  toUserId: 'u_riya',
  body: 'Smoke test message.',
})
expect('POST /api/messages succeeds', sent.status === 201)
const message = sent.json.messages.find((m) => m.body === 'Smoke test message.')
expect('sender auto-read own message', message?.readBy.includes('u_aarav'), JSON.stringify(message?.readBy))
expect('recipient not yet marked read', !message?.readBy.includes('u_riya'))

const marked = await call('POST', '/api/messages/read', {
  userId: 'u_riya',
  partnerId: 'u_aarav',
})
const markedMessage = marked.json.messages.find((m) => m.id === message.id)
expect('markThreadRead updates receipt', markedMessage?.readBy.includes('u_riya'))

/* ------------------------------------------------------------ user edits */
const patched = await call('PATCH', '/api/users/u_aarav', {
  bio: 'Edited by the smoke test.',
  teaches: [{ skillId: 'sk_js', level: 'Advanced' }],
  wants: [{ skillId: 'sk_rust', level: 'Beginner' }],
})
const aarav = patched.json.users.find((u) => u.id === 'u_aarav')
expect('PATCH updates bio', aarav?.bio === 'Edited by the smoke test.')
expect('PATCH replaces teaches', aarav?.teaches.length === 1 && aarav.teaches[0].skillId === 'sk_js')
expect('PATCH replaces wants', aarav?.wants.length === 1 && aarav.wants[0].skillId === 'sk_rust')

/* ----------------------------------------------------------- user create */
const created_user = await call('POST', '/api/users', {
  name: 'Smoke Tester',
  email: 'smoke@campus.edu',
  branch: 'Testing',
  year: '1st year',
  bio: 'I exist to be deleted.',
})
expect('POST /api/users succeeds', created_user.status === 201)
expect('user count grew', created_user.json.users.length === 13, `${created_user.json.users.length}`)
expect(
  'handle derived from name',
  created_user.json.users.some((u) => u.handle === 'smoke.tester'),
)

/* ----------------------------------------------------------- error paths */
const noSlots = await call('POST', '/api/sessions', {
  teacherId: 'u_riya',
  learnerId: 'u_aarav',
  skillId: 'sk_figma',
  topic: 'No slots',
  proposedSlots: [],
})
expect('missing slots rejected', noSlots.status === 400, `HTTP ${noSlots.status}`)

const badRating = await call('POST', '/api/reviews', {
  sessionId: created.id,
  fromUserId: 'u_x',
  toUserId: 'u_y',
  rating: 9,
  text: 'too high',
  role: 'taught',
})
expect('out-of-range rating rejected', badRating.status === 400, `HTTP ${badRating.status}`)

const missing = await call('POST', '/api/nope', {})
expect('unknown endpoint 404s', missing.status === 404, `HTTP ${missing.status}`)

/* ----------------------------------------------------------------- reset */
const reset = await call('POST', '/api/reset')
expect('POST /api/reset succeeds', reset.status === 200)
expect('reset restores 12 users', reset.json.users.length === 12, `${reset.json.users.length}`)
expect('reset restores 12 sessions', reset.json.sessions.length === 12, `${reset.json.sessions.length}`)
expect('reset restores 14 reviews', reset.json.reviews.length === 14, `${reset.json.reviews.length}`)
expect('reset restores 9 messages', reset.json.messages.length === 9, `${reset.json.messages.length}`)
expect(
  'reset clears the smoke-test session',
  !reset.json.sessions.some((s) => s.topic === 'Smoke test session'),
)
expect(
  'reset restores aarav bio',
  reset.json.users.find((u) => u.id === 'u_aarav')?.bio !== 'Edited by the smoke test.',
)

console.log(
  failures === 0
    ? '\nAll API smoke tests passed.\n'
    : `\n${failures} check(s) FAILED.\n`,
)
process.exit(failures === 0 ? 0 : 1)
