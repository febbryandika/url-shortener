import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'
import { unwrap } from '@/lib/api'

// Per-link analytics query key (SPEC §6: ['links', id, 'analytics']). Nested under
// the ['links'] list key so both share the same cache namespace.
export function analyticsQueryKey(id: string) {
  return ['links', id, 'analytics'] as const
}

// GET /api/links/:id/analytics → click aggregations for the analytics detail page
// (total, daily 30-day, top referrers, browser/device breakdowns). Retry policy is
// the shared retryQuery default on the QueryClient (main.tsx) — no 4xx retries.
export function useLinkAnalytics(id: string) {
  return useQuery({
    queryKey: analyticsQueryKey(id),
    queryFn: () =>
      unwrap(client.api.links[':id'].analytics.$get({ param: { id } })),
  })
}
