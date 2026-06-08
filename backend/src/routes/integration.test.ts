import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { db } from '../db'
import redirectRoutes from './redirect'
import { toBrowsers, toDevices, toReferrers } from '../lib/analytics'

// End-to-end contract across the three pieces of the flow, with no live DB:
//   create (a link row) → redirect (/r/:slug logs a click) → analytics (the
//   breakdown mappers aggregate those clicks). It stubs only the slug lookup and
//   captures the fire-and-forget click insert, then runs the *real* redirect
//   handler, UA parsing and analytics mappers over the captured data.

type ClickValues = {
  linkId: string
  referrer: string | null
  browser: string
  deviceType: string
  country: string | null
}

afterEach(() => {
  mock.restore()
})

describe('integration: create → redirect → analytics', () => {
  test('a created link redirects, and its clicks feed the analytics breakdowns', async () => {
    // 1. CREATE — the row POST /api/links would have produced and persisted.
    const link = {
      id: 'link_1',
      userId: 'user_1',
      slug: 'launch',
      url: 'https://example.com/launch',
      title: 'Launch',
      expiresAt: null,
      createdAt: new Date(),
    }

    // The redirect handler looks a slug up — serve the created link.
    spyOn(db.query.links, 'findFirst').mockResolvedValue(
      link as unknown as Awaited<ReturnType<typeof db.query.links.findFirst>>,
    )

    // Capture each fire-and-forget click insert instead of writing to a DB.
    const clicks: ClickValues[] = []
    spyOn(db, 'insert').mockReturnValue({
      values: (values: ClickValues) => {
        clicks.push(values)
        return Promise.resolve()
      },
    } as unknown as ReturnType<typeof db.insert>)

    // 2. REDIRECT — two visitors hit /r/launch with different devices/browsers.
    const fromTablet = await redirectRoutes.request('/launch', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
        referer: 'https://news.example.com/post',
        'cf-ipcountry': 'US',
      },
    })
    const fromPhone = await redirectRoutes.request('/launch', {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
        // no referer → direct navigation
        'cf-ipcountry': 'GB',
      },
    })

    expect(fromTablet.status).toBe(302)
    expect(fromTablet.headers.get('location')).toBe(
      'https://example.com/launch',
    )
    expect(fromPhone.status).toBe(302)

    // Both clicks were logged against the created link.
    expect(clicks).toHaveLength(2)
    expect(clicks.every((c) => c.linkId === 'link_1')).toBe(true)

    // 3. ANALYTICS — the redirect-captured clicks, grouped (each is distinct here)
    //    and run through the real breakdown mappers getLinkAnalytics uses.
    expect(
      toBrowsers(clicks.map((c) => ({ browser: c.browser, count: 1 }))),
    ).toEqual([
      { browser: 'Safari', count: 1 },
      { browser: 'Chrome', count: 1 },
    ])

    expect(
      toDevices(clicks.map((c) => ({ deviceType: c.deviceType, count: 1 }))),
    ).toEqual([
      { deviceType: 'Tablet', count: 1 },
      { deviceType: 'Mobile', count: 1 },
    ])

    // The phone visit had no referer → null → surfaced as "Direct".
    expect(
      toReferrers(clicks.map((c) => ({ referrer: c.referrer, count: 1 }))),
    ).toEqual([
      { referrer: 'https://news.example.com/post', count: 1 },
      { referrer: 'Direct', count: 1 },
    ])
  })
})
