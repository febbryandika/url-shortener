// Absolute base for short URLs — the backend serves /r/:slug (SPEC §2), so its own
// origin is the short-link host. Trailing slash trimmed so we never emit `…//r/slug`.
const shortUrlBase = (
  process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '')

export function toShortUrl(slug: string): string {
  return `${shortUrlBase}/r/${slug}`
}
