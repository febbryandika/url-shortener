import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { auth } from './lib/auth'
import { requireAuth } from './lib/middleware'
import { rateLimit } from './lib/rate-limit'
import { errorHandler, notFoundHandler } from './lib/errors'
import linkRoutes from './routes/links'
import qrRoutes from './routes/qr'
import redirectRoutes from './routes/redirect'
import './types'

const app = new Hono()

// Middleware — requestId first so every log line and the X-Request-Id response
// header carry the same id.
app.use('*', requestId())
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
)

// Rate limit auth endpoints — 10 POST/min per IP (SPEC §7, brute-force protection)
const authRateLimit = rateLimit({ windowMs: 60_000, limit: 10 })
app.use('/api/auth/*', (c, next) =>
  c.req.method === 'POST' ? authRateLimit(c, next) : next(),
)

// Auth routes — better-auth handles /api/auth/**
app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Link CRUD routes (SPEC §5). Registered BEFORE the catch-all `/api` mount below
// so linkRoutes' own middleware (write rate limit + requireAuth) handles every
// /api/links request. If `/api` mounted first, its `requireAuth` would shadow
// these for unauthenticated requests — 401 before the rate limiter ever runs —
// and double-run auth for authenticated ones. Captured into `routes` so the
// inferred AppType carries the routes to the Hono RPC client.
// Public QR endpoint (SPEC §5/§7): GET /api/links/:id/qr returns a PNG with no auth
// so the code stays shareable/printable. Mounted BEFORE the authed linkRoutes (and
// the `/api` requireAuth sub-app below) so its handler runs and returns first —
// requireAuth never sees the request. Not captured into `routes`/AppType: the
// frontend loads it via a plain <img>, not the RPC client (like the redirect route).
app.route('/api/links', qrRoutes)

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- consumed by `export type AppType = typeof routes` below (Hono RPC type capture)
const routes = app.route('/api/links', linkRoutes)

// Public redirect (SPEC §2/§5): GET /r/:slug. Mounted OUTSIDE the /api auth
// sub-app below, so it stays accessible without authentication. Not captured into
// `routes` — the browser navigates here directly (not an RPC endpoint), so it
// stays out of AppType and the frontend typecheck.
app.route('/r', redirectRoutes)

// Protected routes example
const api = new Hono()
api.use('*', requireAuth)

api.get('/me', (c) => {
  const user = c.get('user')
  return c.json({ user })
})

app.route('/api', api)

// Global error + 404 handlers — structured JSON per SPEC §5: { error, code }
app.onError(errorHandler)
app.notFound(notFoundHandler)

// Export for RPC type inference
export type AppType = typeof routes

const port = Number(process.env.PORT ?? 3000)

export default {
  port,
  fetch: app.fetch,
}
