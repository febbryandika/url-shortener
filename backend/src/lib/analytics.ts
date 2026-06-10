import { and, count, desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '../db'
import { clicks } from '../db/schema'
import type { AnalyticsResponse } from './schemas'

// Per-link analytics aggregations (SPEC §3.3). Every query filters on clicks.linkId
// — the leading column of idx_click_link_at — so each one is index-backed. The five
// run concurrently in getLinkAnalytics; neon-http is stateless HTTP, so issuing them
// in parallel keeps the endpoint well under the 300ms target (SPEC §9).

// ── Pure row → item mappers (SPEC §3.3/§5) ────────────────────────────────────
// The grouped breakdown queries return a nullable label + count; these map the
// rows to the API shape. A null referrer means direct navigation → "Direct".
// recordClick always writes a browser/device, so those ?? fallbacks are defensive
// (mirroring parseBrowser/parseDeviceType's own defaults). Extracted as pure
// functions so the labelling logic is unit-testable without a database.
export function toReferrers(
  rows: Array<{ referrer: string | null; count: number }>,
): AnalyticsResponse['referrers'] {
  return rows.map((r) => ({ referrer: r.referrer ?? 'Direct', count: r.count }))
}

export function toBrowsers(
  rows: Array<{ browser: string | null; count: number }>,
): AnalyticsResponse['browsers'] {
  return rows.map((r) => ({ browser: r.browser ?? 'Other', count: r.count }))
}

export function toDevices(
  rows: Array<{ deviceType: string | null; count: number }>,
): AnalyticsResponse['devices'] {
  return rows.map((r) => ({
    deviceType: r.deviceType ?? 'Desktop',
    count: r.count,
  }))
}

// Total clicks — correlated COUNT, the same helper the list route uses (links.ts).
async function countTotalClicks(linkId: string): Promise<number> {
  return db.$count(clicks, eq(clicks.linkId, linkId))
}

// Clicks per day for the last 30 days. date_trunc + ::date::text yields an ISO
// 'YYYY-MM-DD' string; only days with clicks are returned (the frontend fills the
// empty days with 0). The clicked_at range rides the (linkId, clickedAt) index.
async function dailyClicks(
  linkId: string,
): Promise<AnalyticsResponse['daily']> {
  const day = sql<string>`date_trunc('day', ${clicks.clickedAt})::date::text`
  return db
    .select({ date: day, count: count() })
    .from(clicks)
    .where(
      and(
        eq(clicks.linkId, linkId),
        gte(clicks.clickedAt, sql`now() - interval '30 days'`),
      ),
    )
    .groupBy(day)
    .orderBy(day)
}

// Top 5 referrers by click count. A null referrer (direct navigation) is surfaced
// as "Direct" (SPEC §3.3/§5).
async function topReferrers(
  linkId: string,
): Promise<AnalyticsResponse['referrers']> {
  const rows = await db
    .select({ referrer: clicks.referrer, count: count() })
    .from(clicks)
    .where(eq(clicks.linkId, linkId))
    .groupBy(clicks.referrer)
    .orderBy(desc(count()))
    .limit(5)
  return toReferrers(rows)
}

// Clicks grouped by browser. The column is nullable, but recordClick always writes
// a parsed value; ?? 'Other' is a defensive fallback matching parseBrowser's own.
async function browserBreakdown(
  linkId: string,
): Promise<AnalyticsResponse['browsers']> {
  const rows = await db
    .select({ browser: clicks.browser, count: count() })
    .from(clicks)
    .where(eq(clicks.linkId, linkId))
    .groupBy(clicks.browser)
  return toBrowsers(rows)
}

// Clicks grouped by device type. ?? 'Desktop' mirrors parseDeviceType's own fallback.
async function deviceBreakdown(
  linkId: string,
): Promise<AnalyticsResponse['devices']> {
  const rows = await db
    .select({ deviceType: clicks.deviceType, count: count() })
    .from(clicks)
    .where(eq(clicks.linkId, linkId))
    .groupBy(clicks.deviceType)
  return toDevices(rows)
}

// Assemble the full analytics payload (SPEC §5). The five aggregations are
// independent, so they run concurrently.
export async function getLinkAnalytics(
  linkId: string,
): Promise<AnalyticsResponse> {
  const [totalClicks, daily, referrers, browsers, devices] = await Promise.all([
    countTotalClicks(linkId),
    dailyClicks(linkId),
    topReferrers(linkId),
    browserBreakdown(linkId),
    deviceBreakdown(linkId),
  ])
  return { totalClicks, daily, referrers, browsers, devices }
}
