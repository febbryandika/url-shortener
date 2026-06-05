import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { createLinkSchema, type ErrorResponse } from './schemas'
import { validate } from './validate'

// Mount the middleware on a throwaway app and exercise it via Hono's built-in
// app.request() — no server, no business routes needed.
const app = new Hono().post(
  '/links',
  validate('json', createLinkSchema),
  (c) => {
    const body = c.req.valid('json')
    return c.json({ url: body.url })
  },
)

describe('validate middleware', () => {
  test('passes a valid payload to the handler', async () => {
    const res = await app.request('/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: 'https://example.com' })
  })

  test('rejects an invalid payload with a structured { error, code }', async () => {
    const res = await app.request('/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'javascript:alert(1)' }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as ErrorResponse
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })
})
