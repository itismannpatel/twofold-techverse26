import type { IncomingMessage, ServerResponse } from 'node:http'
import { getDb, reseed } from './db'
import * as q from './queries'
import { uid } from '../src/lib/id'

/**
 * The Twofold HTTP API.
 *
 * Written as a plain Connect-style middleware — no Express, no router
 * dependency. Vite's dev and preview servers are both Connect servers, so this
 * mounts into them directly and the whole app runs as ONE process on ONE port.
 * That is deliberate: `npm run dev` stays a single command with no second
 * port to conflict over, which is the property that makes this safe to judge.
 *
 * Every mutating endpoint returns the fresh snapshot, so a write costs exactly
 * one round trip: POST in, new state out, re-render.
 */

type Body = Record<string, unknown>

function send(res: ServerResponse, status: number, payload: unknown): void {
  const json = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Cache-Control': 'no-store',
  })
  res.end(json)
}

function fail(res: ServerResponse, status: number, message: string): void {
  send(res, status, { error: message })
}

async function readBody(req: IncomingMessage): Promise<Body> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return parsed && typeof parsed === 'object' ? (parsed as Body) : {}
  } catch {
    return {}
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export function createApiMiddleware() {
  return async function apiMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ): Promise<void> {
    const url = req.url ?? ''
    if (!url.startsWith('/api/')) return next()

    const db = getDb()
    const method = req.method ?? 'GET'
    const path = url.split('?')[0]
    const parts = path.split('/').filter(Boolean) // e.g. ['api','sessions','s_1','accept']

    try {
      // ------------------------------------------------------------- reads
      if (method === 'GET' && path === '/api/state') {
        send(res, 200, q.snapshot(db))
        return
      }

      if (method !== 'POST' && method !== 'PATCH') {
        fail(res, 405, 'Method not allowed')
        return
      }

      const body = await readBody(req)

      // ------------------------------------------------------------ users
      if (method === 'POST' && path === '/api/users') {
        const name = str(body.name)
        const email = str(body.email)
        if (!name || !email) {
          fail(res, 400, 'name and email are required')
          return
        }
        const id = `u_${uid()}`
        q.insertUser(db, {
          id,
          name,
          email,
          branch: str(body.branch) || 'Undeclared',
          year: str(body.year) || '1st year',
          bio: str(body.bio) || 'New to Twofold — here to trade skills.',
        })
        send(res, 201, q.snapshot(db))
        return
      }

      if (method === 'PATCH' && parts[1] === 'users' && parts[2]) {
        q.applyUserPatch(db, parts[2], {
          name: body.name !== undefined ? str(body.name) : undefined,
          branch: body.branch !== undefined ? str(body.branch) : undefined,
          year: body.year !== undefined ? str(body.year) : undefined,
          bio: body.bio !== undefined ? str(body.bio) : undefined,
          format: body.format !== undefined ? (str(body.format) as 'Online' | 'On campus' | 'Either') : undefined,
          availability: body.availability !== undefined ? strArray(body.availability) : undefined,
          teaches: Array.isArray(body.teaches) ? body.teaches : undefined,
          wants: Array.isArray(body.wants) ? body.wants : undefined,
        })
        send(res, 200, q.snapshot(db))
        return
      }

      // --------------------------------------------------------- sessions
      if (method === 'POST' && path === '/api/sessions') {
        const teacherId = str(body.teacherId)
        const learnerId = str(body.learnerId)
        const skillId = str(body.skillId)
        const topic = str(body.topic)
        if (!teacherId || !learnerId || !skillId || !topic) {
          fail(res, 400, 'teacherId, learnerId, skillId and topic are required')
          return
        }
        const slots = strArray(body.proposedSlots)
        if (slots.length === 0) {
          fail(res, 400, 'at least one proposed slot is required')
          return
        }
        q.insertSession(db, {
          id: `s_${uid()}`,
          teacherId,
          learnerId,
          skillId,
          topic,
          proposedSlots: slots,
          note: str(body.note) || undefined,
        })
        send(res, 201, q.snapshot(db))
        return
      }

      if (method === 'POST' && parts[1] === 'sessions' && parts[2] && parts[3]) {
        const id = parts[2]
        const action = parts[3]

        if (action === 'accept') {
          const slot = str(body.slot)
          if (!slot) {
            fail(res, 400, 'slot is required')
            return
          }
          q.setSessionStatus(db, id, 'confirmed', slot)
        } else if (action === 'decline') {
          q.setSessionStatus(db, id, 'declined')
        } else if (action === 'cancel') {
          q.setSessionStatus(db, id, 'cancelled')
        } else if (action === 'complete') {
          q.setSessionStatus(db, id, 'completed')
        } else {
          fail(res, 404, `Unknown session action: ${action}`)
          return
        }

        send(res, 200, q.snapshot(db))
        return
      }

      // ---------------------------------------------------------- reviews
      if (method === 'POST' && path === '/api/reviews') {
        const sessionId = str(body.sessionId)
        const fromUserId = str(body.fromUserId)
        const toUserId = str(body.toUserId)
        const rating = Number(body.rating)
        if (!sessionId || !fromUserId || !toUserId || !rating) {
          fail(res, 400, 'sessionId, fromUserId, toUserId and rating are required')
          return
        }
        if (rating < 1 || rating > 5) {
          fail(res, 400, 'rating must be between 1 and 5')
          return
        }
        q.insertReview(db, {
          id: `r_${uid()}`,
          sessionId,
          fromUserId,
          toUserId,
          rating: Math.round(rating),
          text: str(body.text) || 'No comment left.',
          role: body.role === 'learned' ? 'learned' : 'taught',
        })
        send(res, 201, q.snapshot(db))
        return
      }

      // --------------------------------------------------------- messages
      if (method === 'POST' && path === '/api/messages') {
        const fromUserId = str(body.fromUserId)
        const toUserId = str(body.toUserId)
        const message = str(body.body)
        if (!fromUserId || !toUserId || !message) {
          fail(res, 400, 'fromUserId, toUserId and body are required')
          return
        }
        q.insertMessage(db, `m_${uid()}`, fromUserId, toUserId, message)
        send(res, 201, q.snapshot(db))
        return
      }

      if (method === 'POST' && path === '/api/messages/read') {
        const userId = str(body.userId)
        const partnerId = str(body.partnerId)
        if (!userId || !partnerId) {
          fail(res, 400, 'userId and partnerId are required')
          return
        }
        q.markThreadRead(db, userId, partnerId)
        send(res, 200, q.snapshot(db))
        return
      }

      // ------------------------------------------------------------- misc
      if (method === 'POST' && path === '/api/reset') {
        reseed()
        send(res, 200, q.snapshot(getDb()))
        return
      }

      fail(res, 404, `No such endpoint: ${method} ${path}`)
    } catch (error) {
      // A 500 must never blank the page — the client keeps its last good state.
      console.error('[twofold api]', method, path, error)
      fail(res, 500, 'Internal server error')
    }
  }
}
