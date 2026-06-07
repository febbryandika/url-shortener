import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import QRCode from 'qrcode'
import { db } from '../db'
import { links } from '../db/schema'
import { ApiError } from '../lib/errors'
import { toShortUrl } from '../lib/short-url'

// Public QR endpoint (SPEC §3.4/§5/§7): GET /api/links/:id/qr → PNG of the link's
// short URL. No auth/ownership — QR codes must stay shareable/printable and the id
// is a non-guessable cuid2. The id is only ever used in a parameterized Drizzle
// query (no injection surface). Generation errors bubble to the central
// errorHandler, which logs them and returns a structured 500.
const qrRoutes = new Hono().get('/:id/qr', async (c) => {
  const id = c.req.param('id')

  const link = await db.query.links.findFirst({
    where: eq(links.id, id),
    columns: { slug: true },
  })
  if (!link) {
    throw new ApiError(404, 'NOT_FOUND', 'Link not found')
  }

  // Encode the short URL (not the destination) so scans route through /r/:slug and
  // get click-tracked. toBuffer yields a PNG raster (SPEC §3.4 — no SVG).
  const png = await QRCode.toBuffer(toShortUrl(link.slug), {
    width: 512,
    margin: 2,
  })

  c.header('Content-Type', 'image/png')
  // The slug is immutable, so the QR never changes — cache it (also helps the
  // <500ms generation NFR, SPEC §9).
  c.header('Cache-Control', 'public, max-age=86400')
  // qrcode returns a Node Buffer; copy into a plain Uint8Array so it matches Hono's
  // body type (Buffer's ArrayBufferLike generic isn't assignable to Uint8Array<ArrayBuffer>).
  return c.body(new Uint8Array(png))
})

export default qrRoutes
