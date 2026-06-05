import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { links } from '../db/schema'
import { requireAuth } from '../lib/middleware'
import { validate } from '../lib/validate'
import { createLinkSchema, type LinkListItem } from '../lib/schemas'
import { ApiError } from '../lib/errors'
import { generateSlug } from '../lib/slug'

type LinkRow = typeof links.$inferSelect

// Absolute base for short URLs — the backend serves /r/:slug (SPEC §2), so its
// own origin is the short-link host. Trailing slash trimmed so we never emit
// `…//r/slug`.
const shortUrlBase = (
  process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '')

function toShortUrl(slug: string): string {
  return `${shortUrlBase}/r/${slug}`
}

// Serialise a DB row into the API list-item shape (SPEC §5): timestamps as ISO
// strings, clickCount supplied by the caller (computed per request, not stored).
function toListItem(row: LinkRow, clickCount: number): LinkListItem {
  return {
    id: row.id,
    slug: row.slug,
    url: row.url,
    title: row.title,
    shortUrl: toShortUrl(row.slug),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    clickCount,
    createdAt: row.createdAt.toISOString(),
  }
}

// Reject a custom slug that's already taken (SPEC §10) with a clean 409 instead
// of surfacing the unique-constraint violation as a 500.
async function ensureCustomSlugFree(slug: string): Promise<string> {
  const existing = await db.query.links.findFirst({
    where: eq(links.slug, slug),
    columns: { id: true },
  })
  if (existing) {
    throw new ApiError(409, 'SLUG_TAKEN', 'That slug is already taken')
  }
  return slug
}

// Generate a unique auto slug, retrying on the unlikely collision up to 3 times
// before giving up (SPEC §3.1). The unique constraint on links.slug backstops a
// race between this check and the insert.
async function generateUniqueSlug(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = generateSlug()
    const existing = await db.query.links.findFirst({
      where: eq(links.slug, slug),
      columns: { id: true },
    })
    if (!existing) return slug
  }
  throw new ApiError(
    500,
    'SLUG_GENERATION_FAILED',
    'Failed to generate unique slug — try a custom one',
  )
}

const linkRoutes = new Hono()
  .use('*', requireAuth)
  .post('/', validate('json', createLinkSchema), async (c) => {
    const userId = c.get('user').id
    const body = c.req.valid('json')

    const slug = body.slug
      ? await ensureCustomSlugFree(body.slug)
      : await generateUniqueSlug()

    const [row] = await db
      .insert(links)
      .values({
        userId,
        slug,
        url: body.url,
        title: body.title ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      })
      .returning()

    if (!row) {
      throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to create link')
    }

    return c.json({ link: toListItem(row, 0) }, 201)
  })

export default linkRoutes
