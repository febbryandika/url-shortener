import { describe, expect, test } from 'bun:test'
import { generateSlug } from './slug'
import { slugSchema } from './schemas'

describe('generateSlug', () => {
  test('returns a 7-char lowercase-alphanumeric slug', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSlug()).toMatch(/^[a-z0-9]{7}$/)
    }
  })

  test('produces slugs that pass the custom-slug schema', () => {
    // Auto slugs must be valid custom slugs too, so the charsets stay aligned.
    expect(slugSchema.safeParse(generateSlug()).success).toBe(true)
  })

  test('is effectively unique across many calls', () => {
    const slugs = new Set(Array.from({ length: 1000 }, () => generateSlug()))
    expect(slugs.size).toBe(1000)
  })
})
