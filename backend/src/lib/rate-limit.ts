import type { Context, Next } from 'hono'

type RateLimitOptions = {
  windowMs: number
  limit: number
}

type Bucket = { count: number; resetAt: number }

// In-memory fixed-window rate limiter keyed by client IP (SPEC §7).
// In-process store — fine for a single instance; swap for Redis when scaling out.
// IP comes from x-forwarded-for (set by proxies/CDN); in local dev there's no
// proxy header, so requests share the "unknown" bucket.
export function rateLimit({ windowMs, limit }: RateLimitOptions) {
  const buckets = new Map<string, Bucket>()

  return async function rateLimitMiddleware(c: Context, next: Next) {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      'unknown'

    const now = Date.now()
    const bucket = buckets.get(ip)

    if (bucket && bucket.resetAt > now) {
      bucket.count++
      if (bucket.count > limit) {
        console.warn(`[rate-limit] ${ip} ${c.req.method} ${c.req.path}`)
        return c.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, 429)
      }
    } else {
      buckets.set(ip, { count: 1, resetAt: now + windowMs })
    }

    await next()
  }
}
