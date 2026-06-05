import { describe, expect, test } from 'bun:test'
import { isErrorResponse, slugSchema, urlSchema } from './schemas'

describe('urlSchema', () => {
  test('accepts http and https URLs', () => {
    expect(urlSchema.safeParse('http://example.com').success).toBe(true)
    expect(
      urlSchema.safeParse('https://example.com/path?q=1#frag').success,
    ).toBe(true)
  })

  test('rejects dangerous / non-http(s) protocols', () => {
    const dangerous = [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
      'ftp://example.com',
      'mailto:user@example.com',
    ]
    for (const value of dangerous) {
      expect(urlSchema.safeParse(value).success).toBe(false)
    }
  })

  test('rejects malformed input', () => {
    expect(urlSchema.safeParse('not a url').success).toBe(false)
    expect(urlSchema.safeParse('').success).toBe(false)
  })
})

describe('slugSchema', () => {
  test('accepts valid slugs', () => {
    for (const value of ['abc', 'a1b', 'my-link-123', 'a'.repeat(32)]) {
      expect(slugSchema.safeParse(value).success).toBe(true)
    }
  })

  test('rejects out-of-range length', () => {
    expect(slugSchema.safeParse('ab').success).toBe(false) // too short
    expect(slugSchema.safeParse('a'.repeat(33)).success).toBe(false) // too long
  })

  test('rejects disallowed characters (incl. path traversal)', () => {
    const invalid = ['Abc', 'a b', 'a_b', 'a.b', 'a/b', '../etc', 'a@b', '']
    for (const value of invalid) {
      expect(slugSchema.safeParse(value).success).toBe(false)
    }
  })
})

describe('isErrorResponse', () => {
  test('accepts a structured { error, code } body', () => {
    expect(isErrorResponse({ error: 'Forbidden', code: 'FORBIDDEN' })).toBe(
      true,
    )
  })

  test('rejects non-error shapes', () => {
    expect(isErrorResponse({ links: [] })).toBe(false)
    expect(isErrorResponse({ error: 'x' })).toBe(false) // missing code
    expect(isErrorResponse({ code: 'x' })).toBe(false) // missing error
    expect(isErrorResponse({ error: 1, code: 2 })).toBe(false) // wrong types
    expect(isErrorResponse(null)).toBe(false)
    expect(isErrorResponse('nope')).toBe(false)
  })
})
