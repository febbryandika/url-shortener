import { Hono } from 'hono'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { clicks, links } from '../db/schema'
import { requireAuth } from '../lib/middleware'
import { validate } from '../lib/validate'
import {
  createLinkSchema,
  updateLinkSchema,
  type LinkListItem,
} from '../lib/schemas'
import { ApiError } from '../lib/errors'
import { generateSlug } from '../lib/slug'

type LinkRow = typeof links.$inferSelect

// The link fields a list item is built from (userId is intentionally omitted) —
// lets both the insert row and the list query feed toListItem.
type LinkListSource = Pick<
  LinkRow,
  'id' | 'slug' | 'url' | 'title' | 'expiresAt' | 'createdAt'
>

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
function toListItem(row: LinkListSource, clickCount: number): LinkListItem {
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

// Fetch a link by id and assert the caller owns it. Throws 404 if it doesn't
// exist, 403 if it belongs to another user — never 404 for someone else's link
// (SPEC §7: no information leakage). Returns the row for the handler to use.
async function requireOwnedLink(id: string, userId: string): Promise<LinkRow> {
  const link = await db.query.links.findFirst({ where: eq(links.id, id) })
  if (!link) {
    throw new ApiError(404, 'NOT_FOUND', 'Link not found')
  }
  if (link.userId !== userId) {
    throw new ApiError(403, 'FORBIDDEN', 'Forbidden')
  }
  return link
}

const linkRoutes = new Hono()
  .use('*', requireAuth)
  .get('/', async (c) => {
    const userId = c.get('user').id

    // clickCount via a correlated COUNT sub-query (SPEC §5) — not stored on the
    // row. db.$count builds it with eq() so the columns stay table-qualified;
    // clicks.linkId is indexed (idx_click_link_at), so it stays cheap.
    const rows = await db
      .select({
        id: links.id,
        slug: links.slug,
        url: links.url,
        title: links.title,
        expiresAt: links.expiresAt,
        createdAt: links.createdAt,
        clickCount: db.$count(clicks, eq(clicks.linkId, links.id)),
      })
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.createdAt))

    return c.json({ links: rows.map((row) => toListItem(row, row.clickCount)) })
  })
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
  .put('/:id', validate('json', updateLinkSchema), async (c) => {
    const userId = c.get('user').id
    const id = c.req.param('id')
    const body = c.req.valid('json')

    const existing = await requireOwnedLink(id, userId)

    // Only title and expiresAt are mutable (SPEC §3.1); slug and url are
    // immutable (updateLinkSchema is .strict(), so they're already rejected).
    // An omitted field is left unchanged; an explicit null clears expiresAt.
    const update: { title?: string | null; expiresAt?: Date | null } = {}
    if ('title' in body) {
      update.title = body.title ?? null
    }
    if ('expiresAt' in body) {
      update.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
    }

    let row = existing
    if (Object.keys(update).length > 0) {
      const [updated] = await db
        .update(links)
        .set(update)
        .where(eq(links.id, id))
        .returning()
      if (!updated) {
        throw new ApiError(500, 'INTERNAL_ERROR', 'Failed to update link')
      }
      row = updated
    }

    const clickCount = await db.$count(clicks, eq(clicks.linkId, id))
    return c.json({ link: toListItem(row, clickCount) })
  })
  .delete('/:id', async (c) => {
    const userId = c.get('user').id
    const id = c.req.param('id')

    await requireOwnedLink(id, userId)

    // Hard delete (SPEC §3.1, no soft delete). Rows in clicks are removed by the
    // ON DELETE CASCADE foreign key (schema.ts), so no manual cleanup is needed.
    await db.delete(links).where(eq(links.id, id))

    return c.json({ success: true })
  })

export default linkRoutes
