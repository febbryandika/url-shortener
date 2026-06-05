import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { auth } from './lib/auth'
import { requireAuth } from './lib/middleware'
import { rateLimit } from './lib/rate-limit'
import { errorHandler, notFoundHandler } from './lib/errors'
import linkRoutes from './routes/links'
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
const routes = app.route('/api/links', linkRoutes)

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
