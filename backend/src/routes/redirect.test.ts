import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { db } from '../db'
import redirectRoutes from './redirect'

// The shape the redirect handler selects for the slug lookup.
type RedirectLink = { id: string; url: string; expiresAt: Date | null }

// The values recordClick() writes — captured instead of inserted.
type ClickValues = {
  linkId: string
  referrer: string | null
  browser: string
  deviceType: string
  country: string | null
}

// Stub the one query the handler runs: db.query.links.findFirst(). Passing
// `undefined` simulates an unknown slug.
function stubLookup(link: RedirectLink | undefined) {
  spyOn(db.query.links, 'findFirst').mockResolvedValue(
    link as unknown as Awaited<ReturnType<typeof db.query.links.findFirst>>,
  )
}

// Replace db.insert so the fire-and-forget click log never touches the network;
// returns a getter for the captured values.
function captureClick(): () => ClickValues | undefined {
  let captured: ClickValues | undefined
  spyOn(db, 'insert').mockReturnValue({
    values: (values: ClickValues) => {
      captured = values
      return Promise.resolve()
    },
  } as unknown as ReturnType<typeof db.insert>)
  return () => captured
}

afterEach(() => {
  mock.restore()
})

describe('GET /r/:slug', () => {
  test('unknown slug → 404', async () => {
    stubLookup(undefined)
    const res = await redirectRoutes.request('/does-not-exist')
    expect(res.status).toBe(404)
  })

  test('valid slug → 302 to the destination URL', async () => {
    stubLookup({ id: 'l1', url: 'https://example.com/page', expiresAt: null })
    captureClick()
    const res = await redirectRoutes.request('/abc1234')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://example.com/page')
  })

  test('logs a click with parsed browser, device, referrer and country', async () => {
    stubLookup({ id: 'l1', url: 'https://example.com', expiresAt: null })
    const getClick = captureClick()

    await redirectRoutes.request('/abc1234', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
        referer: 'https://news.example.com/article',
        'cf-ipcountry': 'US',
      },
    })

    expect(getClick()).toEqual({
      linkId: 'l1',
      referrer: 'https://news.example.com/article',
      browser: 'Chrome',
      deviceType: 'Mobile',
      country: 'US',
    })
  })

  test('missing UA / referrer / country → Other, Desktop and nulls', async () => {
    stubLookup({ id: 'l1', url: 'https://example.com', expiresAt: null })
    const getClick = captureClick()

    await redirectRoutes.request('/abc1234')

    expect(getClick()).toEqual({
      linkId: 'l1',
      referrer: null,
      browser: 'Other',
      deviceType: 'Desktop',
      country: null,
    })
  })
})

describe('GET /r/:slug — expiry (SPEC §3.2/§7)', () => {
  test('expired link (past expiresAt) → 410 and no redirect', async () => {
    stubLookup({
      id: 'l1',
      url: 'https://example.com',
      expiresAt: new Date(Date.now() - 60_000),
    })
    const res = await redirectRoutes.request('/abc1234')
    expect(res.status).toBe(410)
    expect(res.headers.get('location')).toBeNull()
  })

  test('not-yet-expired link (future expiresAt) → 302', async () => {
    stubLookup({
      id: 'l1',
      url: 'https://example.com/page',
      expiresAt: new Date(Date.now() + 60_000),
    })
    captureClick()
    const res = await redirectRoutes.request('/abc1234')
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://example.com/page')
  })
})
