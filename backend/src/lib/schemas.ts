import { z } from 'zod'

// Shared validation schemas and API contract types (SPEC §5).
//
// This module is intentionally dependency-free apart from `zod` so the frontend
// can import it across the workspace boundary (`../../../backend/src/lib/schemas`)
// — the same pattern `frontend/src/lib/client.ts` uses for `AppType` — without
// pulling in any server-only code (db, better-auth, Bun APIs). Keep it that way.

// ── Field schemas ─────────────────────────────────────────────────────────────

// Custom slug: 3–32 chars, lowercase letters / digits / hyphens (SPEC §3.1, §5).
// The charset excludes `/`, `.`, and whitespace, so it cannot express path
// traversal (SPEC §7: "no path traversal characters"). Regex is the exact SPEC
// pattern; only a friendly message is added.
export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9-]{3,32}$/,
    'Slug must be 3–32 characters: lowercase letters, numbers, and hyphens only',
  )

// Destination URL — must be a valid http(s) URL. `z.string().url()` alone accepts
// dangerous schemes (javascript:, data:, file:, …); we additionally restrict to
// http/https to prevent stored-XSS / SSRF via shortened links (web-security:
// choose the restrictive option).
function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

export const urlSchema = z
  .string()
  .url()
  .refine(isHttpUrl, { message: 'URL must start with http:// or https://' })

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

// Well-known machine-readable error codes (SPEC §5). `ErrorResponse.code` stays a
// plain string so domain-specific codes remain valid; this union just documents
// the shared ones the frontend can branch on.
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'HTTP_ERROR'
  | 'INTERNAL_ERROR'
  | 'SLUG_TAKEN'

// Runtime guard: narrows an unknown JSON body (e.g. from `response.json()`) to
// the shared ErrorResponse shape, so the frontend can tell a structured error
// apart from a success payload.
export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) return false
  return (
    'error' in value &&
    typeof value.error === 'string' &&
    'code' in value &&
    typeof value.code === 'string'
  )
}

// Flatten a ZodError into a single user-friendly string for the `error` field of
// an ErrorResponse, e.g. "url: URL must start with http:// or https://". Mirrors
// the issue-formatting style already used in lib/env.ts.
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join('; ')
}
