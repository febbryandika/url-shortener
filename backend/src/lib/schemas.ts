import { z } from 'zod'

// Shared validation schemas and API contract types (SPEC §5).
//
// This module is intentionally dependency-free apart from `zod` so the frontend
// can import it across the workspace boundary (`../../../backend/src/lib/schemas`)
// — the same pattern `frontend/src/lib/client.ts` uses for `AppType` — without
// pulling in any server-only code (db, better-auth, Bun APIs). Keep it that way.

// ── Field schemas ─────────────────────────────────────────────────────────────

// Custom slug: 3–32 chars, lowercase letters / digits / hyphens (SPEC §3.1, §5).
export const slugSchema = z.string().regex(/^[a-z0-9-]{3,32}$/)

// Destination URL. Baseline matches SPEC §5's `z.string().url()`; a follow-up
// task tightens this to reject non-http(s) protocols.
export const urlSchema = z.string().url()

// Optional human-friendly label for a link.
export const titleSchema = z.string().max(100)

// Expiry as an ISO 8601 datetime string (SPEC §5).
export const expiresAtSchema = z.string().datetime()

// ── Request body schemas ──────────────────────────────────────────────────────

// POST /api/links
export const createLinkSchema = z.object({
  url: urlSchema,
  slug: slugSchema.optional(),
  title: titleSchema.optional(),
  expiresAt: expiresAtSchema.optional(),
})

// PUT /api/links/:id — title + expiry only. slug and url are immutable, so
// `.strict()` rejects a body that tries to include them (SPEC §5). `expiresAt`
// is nullable so clients can clear an existing expiry.
export const updateLinkSchema = z
  .object({
    title: titleSchema.optional(),
    expiresAt: expiresAtSchema.nullable().optional(),
  })
  .strict()

export type CreateLinkInput = z.infer<typeof createLinkSchema>
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>

// ── Shared API error contract (SPEC §5) ───────────────────────────────────────

// Every API error response uses this shape. Shared so the frontend can type
// failures consistently.
export type ErrorResponse = {
  error: string // human-readable message
  code: string // machine-readable, e.g. "SLUG_TAKEN", "NOT_FOUND", "FORBIDDEN"
}
