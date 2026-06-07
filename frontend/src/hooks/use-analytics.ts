import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'
import { ApiError, unwrap } from '@/lib/api'

// Per-link analytics query key (SPEC §6: ['links', id, 'analytics']). Nested under
// the ['links'] list key so both share the same cache namespace.
export function analyticsQueryKey(id: string) {
  return ['links', id, 'analytics'] as const
}

// Retry transient failures (5xx / network) up to 3 times, but never client errors
// (4xx): a 400/403/404 won't fix itself, so retrying only delays the error UI
// (SPEC §12: query retry handling for analytics fetches).
function retryAnalytics(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 3
}

// GET /api/links/:id/analytics → click aggregations for the analytics detail page
// (total, daily 30-day, top referrers, browser/device breakdowns).
export function useLinkAnalytics(id: string) {
  return useQuery({
    queryKey: analyticsQueryKey(id),
    queryFn: () =>
      unwrap(client.api.links[':id'].analytics.$get({ param: { id } })),
    retry: retryAnalytics,
  })
}
