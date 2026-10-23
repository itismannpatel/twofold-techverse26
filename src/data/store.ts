import type { Database } from './types'

/**
 * Client-side snapshot bus.
 *
 * Replaces the old localStorage store. The shape of the contract is the same
 * — `getSnapshot()` + `subscribe()` behind `useSyncExternalStore` — but the
 * data now lives in SQLite and arrives over HTTP.
 *
 * Sync model: the server stamps every write with a monotonic `version`. The
 * client polls `GET /api/state` once a second and only re-renders when that
 * version actually moves, so an idle tab does no work beyond one tiny
 * comparison. Mutations return the fresh snapshot directly, so your own
 * writes paint immediately rather than waiting for the next tick.
 */

const AUTH_KEY = 'twofold.auth.v1'
const POLL_MS = 1000

const EMPTY: Database = {
  version: 0,
  users: [],
  skills: [],
  sessions: [],
  reviews: [],
  messages: [],
}

let snapshot: Database = EMPTY
let loaded = false
let polling = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function apply(next: Database) {
  // Same version means nothing we render from has changed — skip the re-render.
  if (loaded && next.version === snapshot.version) return
  snapshot = next
  loaded = true
  emit()
}

/* ------------------------------------------------------ external store API */

export function getSnapshot(): Database {
  return snapshot
}

export function isLoaded(): boolean {
  return loaded
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/* ------------------------------------------------------------- transport */

export async function refresh(): Promise<void> {
  try {
    const response = await fetch('/api/state', { cache: 'no-store' })
    if (!response.ok) return
    apply((await response.json()) as Database)
  } catch {
    // Server briefly unavailable (first boot, HMR restart). Keep last state.
  }
}

async function send(method: 'POST' | 'PATCH', path: string, body: unknown): Promise<void> {
  try {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
    if (response.ok) {
      apply((await response.json()) as Database)
      return
    }
  } catch {
    /* fall through to a refetch */
  }
  await refresh()
}

/** POST a mutation; the server replies with the updated snapshot. */
export function post(path: string, body?: unknown): Promise<void> {
  return send('POST', path, body)
}

/** PATCH a mutation; the server replies with the updated snapshot. */
export function patch(path: string, body?: unknown): Promise<void> {
  return send('PATCH', path, body)
}

/**
 * Start the 1s poll. Returns a stop function; safe to call twice.
 * Pauses while the tab is hidden so a backgrounded demo costs nothing.
 */
export function startPolling(): () => void {
  if (polling) return () => {}
  polling = true

  const tick = () => {
    if (document.visibilityState === 'visible') void refresh()
  }

  void refresh()
  const interval = window.setInterval(tick, POLL_MS)

  return () => {
    window.clearInterval(interval)
    polling = false
  }
}

/* ------------------------------------------------------------------- auth */

/**
 * The signed-in identity is client-only, deliberately: this is a demo
 * identity switcher, not an authentication system. No cookies, no passwords,
 * nothing to get locked out of during a judging slot.
 */
export function getCurrentUserId(): string | null {
  try {
    return localStorage.getItem(AUTH_KEY)
  } catch {
    return null
  }
}

export function setCurrentUserId(id: string | null): void {
  try {
    if (id) localStorage.setItem(AUTH_KEY, id)
    else localStorage.removeItem(AUTH_KEY)
  } catch {
    /* ignore */
  }
  // The signed-in id lives outside the snapshot, so the data itself has not
  // changed. Give the snapshot a new identity anyway: `useSyncExternalStore`
  // bails out when the snapshot is `Object.is`-equal, and without this a fresh
  // sign-in would never re-render the app.
  if (loaded) snapshot = { ...snapshot }
  emit()
}
