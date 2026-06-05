import type { ContentfulStatusCode } from 'hono/utils/http-status'

// Typed application error. Throw it from a handler or middleware and the central
// errorHandler serialises it to the structured { error, code } body (SPEC §5),
// e.g. `throw new ApiError(403, 'FORBIDDEN', 'Forbidden')`. A typed error keeps
// failure modes explicit instead of hiding them behind bare throws.
export class ApiError extends Error {
  readonly status: ContentfulStatusCode
  readonly code: string

  constructor(status: ContentfulStatusCode, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}
