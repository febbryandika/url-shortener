import { Hono } from 'hono'
import type { Context } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { clicks, links } from '../db/schema'
import { expiredPage, notFoundPage } from '../lib/redirect-pages'
import { parseBrowser, parseDeviceType } from '../lib/user-agent'

// Log a redirect outcome with its latency (SPEC §9/§12 — redirect request, failure,
// and latency logging). A 302 is a normal request (info); 404/410 are failures
// (warn). console.info/warn are intentional observability logs, not debug output.
function logRedirect(slug: string, status: number, start: number): void {
  const ms = Math.round(performance.now() - start)
  const line = `[redirect] ${slug} -> ${status} ${ms}ms`
  if (status === 302) {
    console.info(line)
  } else {
    console.warn(line)
  }
}

// Record the click for analytics — fire-and-forget so it never delays the 302
// (SPEC §3.2/§9; CLAUDE.md: no waitUntil on Bun, so don't await). A failed insert
// is logged, never surfaced to the visitor.
function recordClick(c: Context, linkId: string): void {
  const ua = c.req.header('user-agent') ?? ''
  db.insert(clicks)
    .values({
      linkId,
      referrer: c.req.header('referer') ?? null,
      browser: parseBrowser(ua),
      deviceType: parseDeviceType(ua),
      country: c.req.header('cf-ipcountry') ?? null,
    })
    .catch((err: unknown) => console.error('[redirect] click log failed', err))
}

// Public redirect route (SPEC §3.2/§5): GET /r/:slug. Mounted at /r in index.ts,
// OUTSIDE the /api auth sub-app, so it stays accessible without authentication.
const redirectRoutes = new Hono().get('/:slug', async (c) => {
  const start = performance.now()
  const slug = c.req.param('slug')

  // Slug lookup — select only what the redirect needs. slug is indexed
  // (idx_link_slug) and only ever used in this parameterized query, so there is no
  // injection surface. Keeps the lookup lean for the <100ms target (SPEC §9).
  const link = await db.query.links.findFirst({
    where: eq(links.slug, slug),
    columns: { id: true, url: true, expiresAt: true },
  })

  // Missing slug → 404 with a styled screen (SPEC §3.2). The slug is never echoed
  // into the HTML, so there is no reflected-XSS surface.
  if (!link) {
    logRedirect(slug, 404, start)
    return c.html(notFoundPage(), 404)
  }

  // Expiry checked before redirect (SPEC §3.2/§7) → 410 with a styled screen.
  if (link.expiresAt && link.expiresAt < new Date()) {
    logRedirect(slug, 410, start)
    return c.html(expiredPage(), 410)
  }

  // Non-blocking click log (SPEC §3.2) — fired before returning but never awaited,
  // so analytics work cannot delay the redirect.
  recordClick(c, link.id)

  // 302 to the destination. link.url was restricted to http/https at creation
  // (urlSchema), so it is safe as the Location header without re-validation here.
  logRedirect(slug, 302, start)
  return c.redirect(link.url, 302)
})

export default redirectRoutes
