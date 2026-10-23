# skill.md — Twofold project context

> **Purpose:** persistent memory for this project. If context is lost, read this file
> first, then `README.md`, then `docs/DATA_MODEL.md` and `docs/API.md`.
> Keep this file updated as the project evolves.

---

## 0. ⚠️ ACTIVE DIRECTION — read this first

**ADR-001 · 2026-10-23 · Status: ACCEPTED — IMPLEMENTED; browser flow audit pending**

> **Decision:** Rebuild the data layer on a real **SQLite backend** as the app's
> *default* path. The `localStorage` mockup is being retired, not kept as a fallback.
>
> **Context:** Architecture review weighed a pure-frontend showcase (zero risk, runs
> instantly) against a full-stack setup (visible backend depth, added setup risk).
> Recommendation was to stay pure-frontend. **The team overruled it** and chose the
> full-stack path, with >6 hours before the deadline.
>
> **Non-negotiable that survives the decision:** judges clone and run
> `npm install && npm run dev`. Whatever we build must not add a second process, a
> port conflict, a migration step or an env var to that command. This constraint
> outranks "showing backend depth" — a backend that fails to boot scores zero.

**How the risk is engineered out (follow these, they are the whole point):**

1. **One process, one port.** Mount the API into Vite's dev server with a
   `configureServer` plugin — and into `configurePreviewServer` for
   `npm run preview`. No `concurrently`, no second port, no CORS.
2. **Commit SQL text, never a binary `.db`.** `server/db/schema.sql` and
   `server/seed.ts` are source. The `.db` file is gitignored and generated on
   boot. A binary DB has opaque diffs and goes stale silently.
3. **Reseed on every boot.** The demo needs "in 3 days" to read correctly
   whenever the repo is cloned, so relative dates are injected by the seeding
   code in JS. Deleting and regenerating a 12-row demo DB costs milliseconds.
4. **No ORM codegen, no engine download.** No Prisma (its engines download at
   install and `prisma generate` can fail on a fresh clone). Prefer raw SQL.
5. **Keep `src/data/api.ts` as the seam.** Its function signatures must survive
   the rewrite; the UI above it should barely change.

**Locked implementation choices:** raw SQL via `better-sqlite3` pinned exactly
to `12.2.0` (Node 20 prebuild compatibility); 1-second full-snapshot polling;
demo identity switcher retained without real authentication.

**Superseded by this ADR:** section 2's "no backend dependencies" claim and
section 9 rule 4 are now about the *runtime* only, not the whole stack.

---

## 1. What we are building

**Twofold** — a peer-to-peer skill exchange for students.

- **Competition brief:** Topic #03 · Peer-to-Peer Skill Exchange.
- **Constraint that shapes everything:** judges clone the repo and run
  `npm install && npm run dev`; Vite serves the app and SQLite API in one process
  and on one port, with no API keys, external network, or migration command.
- **Therefore:** a local SQLite-backed app, seeded with believable data, with a
  real matching engine and real `.ics` export.
- **Non-negotiable:** the UI has to look premium, not like a bootcamp CRUD app.

Tagline: *Trade what you know for what you wish you knew.*

---

## 2. Stack and why

| Choice | Reason |
|---|---|
| React 18 + TypeScript (strict) + Vite 5 | Fast dev loop, zero-config build, types catch drift across 8 pages |
| React Router 6 | Flat, readable route table in `App.tsx` |
| Plain CSS with a token layer | Full control of the aesthetic; no utility-framework drift or runtime cost. 4 stylesheets, imported in order |
| `@fontsource` (Inter + Instrument Serif) | Fonts are **self-hosted via npm** — no Google Fonts request, works offline |
| Hand-rolled icon set (`components/icons.tsx`) | One 24px grid, 1.6px stroke, no icon-library install risk |
| SQLite via `better-sqlite3` 12.2.0 + raw SQL | Persistent local backend with a Node 20-compatible prebuilt binary |
| Vite Connect middleware + 1-second polling | One process/port, simple shared snapshots across tabs |
| Custom 12-line shapecircle-free helpers | No date libraries — `Intl` and small formatters in `lib/format.ts` |

Runtime dependencies include React, React Router, local fonts, and pinned `better-sqlite3` 12.2.0.

---

## 3. Directory map

```
src/
├── main.tsx                 entry: fonts → styles → Router → AppProvider → ToastProvider
├── App.tsx                  routes; ProtectedLayout wraps 7 routes in <AppShell>
├── components/              presentational + a few stateful widgets
│   ├── AppShell.tsx         sidebar (desktop) + sticky top bar & bottom tabs (mobile)
│   ├── icons.tsx            Icon name union + StarIcon
│   ├── Avatar.tsx           gradient avatar from user.hue + initials
│   ├── MatchRing.tsx        SVG dial, useId gradient, score 0-100
│   ├── Rating.tsx           RatingStars (fractional via clip-path) + StarPicker
│   ├── SkillChip.tsx        chip with tone teach|learn|neutral
│   ├── PersonCard.tsx       discover grid card
│   ├── MatchCard.tsx        match card + score bars + request/message actions
│   ├── SessionCard.tsx      full session lifecycle UI
│   ├── RequestSessionModal.tsx
│   ├── ReviewModal.tsx
│   ├── Modal.tsx            portal, Esc close, scroll lock
│   ├── Toast.tsx            ToastProvider + useToast
│   ├── Reveal.tsx           IntersectionObserver fade-up
│   └── EmptyState.tsx
├── context/AppContext.tsx   useApp() → { db, user, signIn, signOut, resetDemo }; useCurrentUser()
├── data/
│   ├── types.ts             User, Skill, ExchangeSkill, Session, Review, Message, Database
│   ├── catalog.ts           41 skills, 8 categories (+ glyph metadata)
│   ├── store.ts             HTTP snapshot bus, subscribe, 1-second polling
│   └── api.ts               UI data access; sends writes to the local API
├── lib/
│   ├── matching.ts          scoreMatch / computeMatches / scoreEveryone + MATCH_WEIGHTS
│   ├── ics.ts               buildIcs / downloadIcs
│   ├── format.ts            initials, formatDay/Time, timeAgo, untilLabel, dayLabel…
│   └── id.ts                uid()
├── pages/                   Landing, Auth, Discover, Matches, Profile, MyProfile, Sessions, Chat
└── styles/                  tokens.css → layout.css → components.css → pages.css
server/
├── api.ts                    Connect-style JSON endpoints
├── db.ts                     SQLite lifecycle and seed-on-boot logic
├── queries.ts                Prepared raw SQL + snapshot hydration
├── seed.ts                   Demo rows with relative timestamps
├── vite-plugin.ts            API mount for dev and preview
└── db/schema.sql             SQLite schema; binary database is generated
```

---

## 4. Data model (summary — full version in `docs/DATA_MODEL.md`)

The API returns a `Database` snapshot with a monotonic `version` for polling:

- `users` — 12 seeded. `teaches[]` / `wants[]` are `ExchangeSkill { skillId, level }`.
  `hue` drives the gradient avatar. `verified` shows the shield.
- `skills` — 41 across Programming, Design, Music, Languages, Academics, Fitness, Business, Arts.
- `sessions` — 12 seeded across all five statuses: `proposed | confirmed | completed | declined | cancelled`.
  A session is directional: `teacherId` teaches `skillId` to `learnerId`.
- `reviews` — 14 seeded. `role` describes **what the recipient did** (`taught` / `learned`).
- `messages` — 9 seeded. Threads are implicit: a pair of user ids. `readBy[]` drives unread badges.

Persistent state is stored in the ignored `server/db/twofold.db` SQLite file.
The demo identity alone is stored in browser `localStorage` as
`twofold.auth.v1` (selection only; no credentials or real authentication).

---

## 5. Matching engine (`lib/matching.ts`)

Weights, out of 100: **learn 45 · reciprocity 35 · affinity 12 · trust 8**.

- `canLearn` = their `teaches` ∩ my `wants`
- `canTeach` = my `teaches` ∩ their `wants`
- `learn` and `teach` saturate at 2 skills (`min(1, n/2) * weight`)
- `affinity` = shared categories across both lists, saturating at 3, ×12
- `trust` = `average/5 × 8`, or a neutral 0.6 multiplier with no reviews
- `computeMatches` filters to `canLearn.length > 0` and sorts by score
- `reciprocal` = both directions non-empty

Scores are **never stored** — always derived, so adding a review or editing skills
immediately re-ranks everything.

---

## 6. UI system (read before adding screens)

**Tokens** live in `styles/tokens.css`:

- Surfaces `--ink-0..3`, hairlines `--line` / `--line-strong`
- Text `--text`, `--text-2`, `--text-3`, `--text-4`
- Semantic accents: `--ember` (teach / primary action), `--mint` (learn / success), `--gold` (ratings), `--danger`
- Gradients `--grad-ember`, `--grad-surface`; radii `--r-sm..xl`; motion `--ease`, `--dur`

**Conventions:**

- Display type = `--font-display` (Instrument Serif) via `.page-title`, `.section-title`, `.display`
- UI type = Inter; labels use `.eyebrow` / `.field-label` (uppercase, tracked)
- Buttons: `.btn` + `-primary | -ghost | -soft | -outline | -quiet | -danger`, sizes `-sm | -lg | -block`
- Cards: `.card` (+ `.card-hover`, `.card-flat`, `.card-glow`, `.card-pad-lg`)
- Chips: `.chip` (+ `-ember`, `-mint`, `-gold`, `-lg`, `.is-on`)
- Layout: `.page-head`, `.grid-cards`, `.grid-2/3`, `.sidebar-layout`, `.section`
- Everything is responsive down to 360px; the sidebar is replaced by `.mobile-tabs` under 900px.

**Gotchas learned the hard way:**

- Any `<span>` that needs `overflow: hidden` + ellipsis needs `display: block` (or to be a
  flex/grid item). This bit `.thread-preview` and `.bar-fill` already.
- `.content` has `max-width: 1120px` — keep it under viewport − sidebar to avoid a horizontal scrollbar.
- `body::before` paints a fixed grain overlay at 2.8% opacity. Do not stack more texture on it.
- **`useSyncExternalStore` bails out when its snapshot is `Object.is`-equal.** Server snapshots
  are replaced when the API version changes. The demo identity lives separately in browser
  `localStorage`, so `setCurrentUserId()` clones the loaded snapshot and emits to force auth
  consumers to re-render.

---

## 7. Routes

| Path | Page | Notes |
|---|---|---|
| `/` | Landing | Marketing page, works signed in or out |
| `/auth` | Auth | Demo student picker + create-profile form; deliberately reachable while signed in so you can switch identities |
| `/discover` | Discover | Search, categories, sort, two-way filter |
| `/matches` | Matches | Ranked, reciprocal first, score transparency |
| `/sessions` | Sessions | Tabs: Upcoming / Requests / Completed / Closed |
| `/messages` | Chat | Auto-opens the first thread on desktop |
| `/messages/:partnerId` | Chat | Conversation with one student |
| `/u/:userId` | Profile | Public profile, reviews, your match with them |
| `/profile` | MyProfile | Edit identity, availability, skills + levels |
| `*` | → `/discover` | |

`ProtectedLayout` in `App.tsx` redirects to `/auth` when no user is selected.

---

## 8. Progress log

**Previously verified before the SQLite migration; recheck after migration:**

- [x] Scaffold, design system, all 8 pages, app shell, mobile layout
- [x] SQLite backend + JS seed + API snapshot polling (ADR-001)
- [x] Matching engine, `.ics` export
- [x] Sign-in as demo student → Discover renders 11 students with live scores
- [x] Request session modal → creates `proposed` session → lands on Sessions
- [x] Accept a proposed slot → `confirmed` + `scheduledFor` set, card moves to Upcoming
- [x] Chat send → persists, draft clears; Demo reply arrives with typing indicator
- [x] My profile edit → save persists + toast
- [x] Public profile → reviews, rating, match sidebar
- [x] `npx tsc --noEmit` clean, `npm run build` clean
- [x] Fixed: inline-span overflow (`.thread-preview`, `.bar-fill`), horizontal overflow
      at 1440px, React Router future-flag warnings
- [x] Fixed: sign-in did not re-render the app (see gotcha below) and bounced back to `/auth`

**ADR-001 implementation:** SQLite, raw SQL, the Vite-mounted API, and 1-second
polling are implemented. Endpoint smoke checks cover the data mutations; the
post-migration browser flow audit is still pending.

- `npm run build` and direct `tsc --noEmit` pass; the API smoke script passes
  40/40 against dev and preview servers.
- Seed-on-boot was verified with an isolated SQLite file: a created user was
  removed and the 12-user seed restored after restarting Vite.
- Fixed preview middleware mounting so `/api/state` returns JSON before Vite's
  SPA fallback handles requests.
- Browser click-through and 360px viewport checks remain pending because this
  environment cannot launch or control a browser.

**Not done / possible next steps:**

- Hosted deployment and production authentication (the current API is a local demo backend)
- Notifications (email/push are out of scope for the local demo)
- Session rescheduling / cancellation reasons
- Profile photo upload (gradient avatars are deliberate: zero assets, zero network)
- Matching across a larger catalogue (currently a pure O(n) scan — fine at 12 users)

---

## 9. House rules

1. **Never import `store.ts` from a component.** Go through `api.ts`.
2. **Never hardcode a user or skill id in a page** — read from context/api.
3. **Derive, don't store**: ratings, match scores, thread unread counts are all computed.
4. Keep `npm install` clean — no new runtime dependencies without a strong reason.
5. Any change to the visual language goes into the token layer first, then components.
6. After edits: `npm run typecheck && npm run build`, then click through the affected flow.
7. Keep schema changes in `server/db/schema.sql`; the schema is applied at boot,
   and the database is reseeded for each server process.
