import { describe, expect, test } from 'bun:test'
import { urlSchema } from './schemas'

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
