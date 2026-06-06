import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { client } from '@/lib/client'
import { unwrap } from '@/lib/api'
import type { CreateLinkInput } from '../../../backend/src/lib/schemas'

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

// POST /api/links → create a link, then refetch the list. Callers handle success
// navigation / error toasts via the mutate(...) callbacks so this stays reusable.
export function useCreateLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLinkInput) =>
      unwrap(client.api.links.$post({ json: input })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linksQueryKey })
    },
  })
}

// DELETE /api/links/:id → hard delete (clicks cascade), then refetch the list.
// No optimistic removal (per project constraints) — invalidate and refetch.
export function useDeleteLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(client.api.links[':id'].$delete({ param: { id } })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linksQueryKey })
    },
  })
}
