import type { Context, Next } from 'hono'
import { auth } from './auth'

export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    console.warn(`[auth] unauthorized: ${c.req.method} ${c.req.path}`)
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
  }
  c.set('user', session.user)
  c.set('session', session.session)
  await next()
}
