import { describe, expect, test } from 'bun:test'
import {
  createLinkSchema,
  isErrorResponse,
  slugSchema,
  updateLinkSchema,
  urlSchema,
} from './schemas'

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

describe('createLinkSchema', () => {
  test('accepts a minimal body (url only) and a full body', () => {
    expect(
      createLinkSchema.safeParse({ url: 'https://example.com' }).success,
    ).toBe(true)
    expect(
      createLinkSchema.safeParse({
        url: 'https://example.com/page',
        slug: 'my-link-1',
        title: 'My link',
        expiresAt: '2030-01-01T00:00:00.000Z',
      }).success,
    ).toBe(true)
  })

  test('rejects an invalid or dangerous url', () => {
    expect(createLinkSchema.safeParse({ url: 'not-a-url' }).success).toBe(false)
    expect(
      createLinkSchema.safeParse({ url: 'javascript:alert(1)' }).success,
    ).toBe(false)
  })

  test('rejects an invalid custom slug', () => {
    expect(
      createLinkSchema.safeParse({ url: 'https://example.com', slug: 'ab' })
        .success,
    ).toBe(false) // too short
    expect(
      createLinkSchema.safeParse({
        url: 'https://example.com',
        slug: 'Bad Slug',
      }).success,
    ).toBe(false) // uppercase + space
  })

  test('rejects an over-long title and a non-ISO expiresAt', () => {
    expect(
      createLinkSchema.safeParse({
        url: 'https://example.com',
        title: 'a'.repeat(101),
      }).success,
    ).toBe(false)
    expect(
      createLinkSchema.safeParse({
        url: 'https://example.com',
        expiresAt: '2030-01-01', // date only, not a datetime
      }).success,
    ).toBe(false)
  })
})

describe('updateLinkSchema', () => {
  test('accepts a title-only update, an empty body, and a null expiry', () => {
    expect(updateLinkSchema.safeParse({ title: 'Renamed' }).success).toBe(true)
    expect(updateLinkSchema.safeParse({}).success).toBe(true) // no-op update
    expect(updateLinkSchema.safeParse({ expiresAt: null }).success).toBe(true) // clear expiry
  })

  test('rejects changes to the immutable slug or url (.strict)', () => {
    expect(updateLinkSchema.safeParse({ slug: 'new-slug' }).success).toBe(false)
    expect(
      updateLinkSchema.safeParse({ url: 'https://example.com' }).success,
    ).toBe(false)
    expect(
      updateLinkSchema.safeParse({ title: 'ok', url: 'https://example.com' })
        .success,
    ).toBe(false)
  })
})
