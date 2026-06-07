import type { ErrorResponse } from '../../../backend/src/lib/schemas'

// Minimal structural view of a Hono RPC client response — just what `unwrap`
// needs. Staying structural avoids coupling to Hono's ClientResponse generics
// while still inferring the success type T from a real `client.x.$get()` call.
type JsonResponse<T> = {
  ok: boolean
  status: number
  json: () => Promise<T>
}

// Thrown by `unwrap` when an API call fails. Carries the structured machine code
// and HTTP status so error-state UIs (and TanStack Query) can branch on them.
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Await a Hono RPC client call and return its typed JSON on success, or throw a
// typed ApiError parsed from the { error, code } body on failure. Throwing is
// exactly what TanStack Query's useQuery / useMutation expect, e.g.
//
//   useQuery({ queryKey: ['links'], queryFn: () => unwrap(client.api.links.$get()) })
export async function unwrap<T>(
  response: JsonResponse<T> | Promise<JsonResponse<T>>,
): Promise<T> {
  const res = await response
  if (!res.ok) {
    throw await toApiError(res)
  }
  return res.json()
}

async function toApiError(res: {
  status: number
  json: () => Promise<unknown>
}): Promise<ApiError> {
  let code = 'UNKNOWN'
  let message = `Request failed (${res.status})`
  try {
    const body = (await res.json()) as Partial<ErrorResponse>
    if (typeof body.code === 'string') code = body.code
    if (typeof body.error === 'string') message = body.error
  } catch {
    // Non-JSON error body — keep the status-based fallback.
  }
  return new ApiError(res.status, code, message)
}

// Retry policy for all queries (TanStack Query `retry`): never retry client errors —
// a 4xx (400/401/403/404) won't fix itself, so retrying only delays the error UI —
// but retry transient 5xx / network failures up to 3 times. Wired as the global
// QueryClient default in main.tsx so every useQuery shares one rule (SPEC §12).
export function retryQuery(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 3
}
