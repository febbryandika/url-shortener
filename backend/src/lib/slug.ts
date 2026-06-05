import { customAlphabet } from 'nanoid'

// Auto-generated slugs share the custom-slug charset ([a-z0-9-], SPEC §3.1) —
// lowercase alphanumeric, 7 chars. No hyphen, so a generated slug can never
// start/end with one or read as a double hyphen. 36^7 ≈ 78B keyspace, so
// collisions are rare; the create handler retries on the unlikely clash.
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 7)

export function generateSlug(): string {
  return nanoid()
}
