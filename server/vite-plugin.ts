import type { Connect, Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ApiHandler = (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>

/**
 * Mounts the Twofold API into Vite's own Connect servers.
 *
 * This is the trick that keeps `npm run dev` a single process on a single
 * port: instead of running a separate API server and proxying to it, the API
 * becomes middleware on the dev server (and, for `npm run preview`, on the
 * preview server). No `concurrently`, no second port, no CORS.
 *
 * The middleware is registered *directly* inside the hook rather than via the
 * returned post-hook, so `/api/*` is answered before Vite's internal
 * middlewares and its SPA HTML fallback can touch it.
 *
 * The server module is imported lazily so `vite build` never loads the native
 * SQLite binding.
 */
export function twofoldApi(): Plugin {
  let middleware: ApiHandler | null = null

  async function load() {
    if (!middleware) {
      const { createApiMiddleware } = await import('./api')
      middleware = createApiMiddleware()
    }
    return middleware
  }

  function mount(server: { middlewares: Connect.Server }) {
    // Register synchronously so this runs before Vite's SPA fallback. Only the
    // server module import is deferred; attaching the middleware itself cannot
    // wait on it, or the first /api request may receive index.html instead.
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next()
      void load().then((handler) => handler(req, res, next)).catch(next)
    })
  }

  return {
    name: 'twofold-api',
    configureServer(server) {
      mount(server)
    },
    configurePreviewServer(server) {
      mount(server)
    },
  }
}
