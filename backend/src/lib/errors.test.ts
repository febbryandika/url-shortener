import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { z } from 'zod'
import { ApiError, errorHandler, notFoundHandler } from './errors'
import type { ErrorResponse } from './schemas'

const app = new Hono()
  .get('/api-error', () => {
    throw new ApiError(403, 'FORBIDDEN', 'Forbidden')
  })
  .get('/zod-error', () => {
    z.string().parse(123) // throws ZodError
    return new Response()
  })
  .get('/boom', () => {
    throw new Error('kaboom')
  })
app.onError(errorHandler)
app.notFound(notFoundHandler)

describe('errorHandler', () => {
  test('serialises ApiError to { error, code } with its status', async () => {
    const res = await app.request('/api-error')
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden', code: 'FORBIDDEN' })
  })

  test('maps a ZodError to a 400 VALIDATION_ERROR', async () => {
    const res = await app.request('/zod-error')
    expect(res.status).toBe(400)
    const body = (await res.json()) as ErrorResponse
    expect(body.code).toBe('VALIDATION_ERROR')
  })

  test('hides unexpected errors behind a 500 INTERNAL_ERROR', async () => {
    const res = await app.request('/boom')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    })
  })
})

describe('notFoundHandler', () => {
  test('returns a structured 404', async () => {
    const res = await app.request('/nope')
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not Found', code: 'NOT_FOUND' })
  })
})
