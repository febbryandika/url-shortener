import type { ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'
import { formatZodError } from './schemas'

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

// Central error formatter — turns any thrown error into a structured
// { error, code } body (SPEC §5). Wire via `app.onError(errorHandler)`.
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: err.message, code: err.code }, err.status)
  }

  // A schema parsed outside the validate() middleware still yields a clean 400.
  if (err instanceof ZodError) {
    return c.json({ error: formatZodError(err), code: 'VALIDATION_ERROR' }, 400)
  }

  if (err instanceof HTTPException) {
    return c.json({ error: err.message, code: 'HTTP_ERROR' }, err.status)
  }

  // Unexpected: log server-side (with the request id) — never leak internals.
  console.error(
    `[error] ${c.get('requestId')} ${c.req.method} ${c.req.path}`,
    err,
  )
  return c.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, 500)
}

// 404 handler — structured to match the error contract (SPEC §5).
export const notFoundHandler: NotFoundHandler = (c) =>
  c.json({ error: 'Not Found', code: 'NOT_FOUND' }, 404)
