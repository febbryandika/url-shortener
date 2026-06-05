import { useQuery } from '@tanstack/react-query'
import { client } from '@/lib/client'
import { unwrap } from '@/lib/api'

// Shared key for the user's link list. Mutations (create/update/delete) invalidate
// this so the dashboard refetches — the SPEC §6 cache strategy (no optimistic updates).
export const linksQueryKey = ['links'] as const

// GET /api/links → the authenticated user's links with click counts.
export function useLinks() {
  return useQuery({
    queryKey: linksQueryKey,
    queryFn: () => unwrap(client.api.links.$get()),
  })
}
