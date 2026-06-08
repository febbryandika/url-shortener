import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { db } from '../db'
import { requireOwnedLink } from './links'

// A full link row, as db.query.links.findFirst() (no column filter) returns it.
const link = {
  id: 'l1',
  userId: 'owner-1',
  slug: 'abc1234',
  url: 'https://example.com',
  title: null,
  expiresAt: null,
  createdAt: new Date(),
}

// Stub the single lookup the authorization check makes; `undefined` = no such link.
function stubLookup(value: typeof link | undefined) {
  spyOn(db.query.links, 'findFirst').mockResolvedValue(
    value as unknown as Awaited<ReturnType<typeof db.query.links.findFirst>>,
  )
}

afterEach(() => {
  mock.restore()
})

describe('requireOwnedLink', () => {
  test('returns the row when the caller owns the link', async () => {
    stubLookup(link)
    const row = await requireOwnedLink('l1', 'owner-1')
    expect(row.id).toBe('l1')
  })

  test('throws 404 NOT_FOUND when the link does not exist', async () => {
    stubLookup(undefined)
    await expect(requireOwnedLink('missing', 'owner-1')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })

  // SPEC §7: an existing link owned by someone else must be 403, never 404 —
  // a 404 would leak whether that id exists.
  test('throws 403 FORBIDDEN for a link owned by another user', async () => {
    stubLookup(link)
    await expect(
      requireOwnedLink('l1', 'someone-else'),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
  })
})
