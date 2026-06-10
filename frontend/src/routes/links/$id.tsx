import { createFileRoute, Link } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ClickChart } from '@/components/click-chart'
import { ReferrerTable } from '@/components/referrer-table'
import { BreakdownBars } from '@/components/breakdown-bars'
import { QrModal } from '@/components/qr-modal'
import { useLinkAnalytics } from '@/hooks/use-analytics'
import { useLinks } from '@/hooks/use-links'
import { requireSession } from '@/lib/auth-guard'
import { RouteErrorBoundary } from '@/components/route-error-boundary'
import {
  AnalyticsUnavailable,
  NoClicksState,
} from '@/components/analytics-states'

export const Route = createFileRoute('/links/$id')({
  beforeLoad: requireSession,
  component: AnalyticsPage,
  errorComponent: RouteErrorBoundary,
})

function AnalyticsPage() {
  const { id } = Route.useParams()
  const { data, isPending, isError, error, refetch } = useLinkAnalytics(id)

  // Link metadata for the header (title + short URL). There's no single-link GET
  // endpoint, so we read it from the cached ['links'] list (SPEC §6 data strategy).
  const { data: linksData } = useLinks()
  const link = linksData?.links.find((l) => l.id === id)
  const heading = link?.title || link?.slug || 'Link analytics'

  return (
    <DashboardLayout>
      <div className="space-y-1">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight break-words">
          {heading}
        </h1>
        {link && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block break-all text-sm font-medium text-primary hover:underline"
            >
              {link.shortUrl}
            </a>
            <QrModal linkId={link.id} slug={link.slug} />
          </div>
        )}
      </div>

      <div className="mt-8">
        {isPending ? (
          <AnalyticsSkeleton />
        ) : isError ? (
          <AnalyticsUnavailable error={error} onRetry={() => refetch()} />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <StatTile label="Total clicks" value={data.totalClicks} />
              <StatTile
                label="Last 30 days"
                value={data.daily.reduce((sum, d) => sum + d.count, 0)}
              />
            </div>

            {data.totalClicks === 0 ? (
              <NoClicksState />
            ) : (
              <>
                <section
                  aria-labelledby="chart-heading"
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <h2 id="chart-heading" className="text-sm font-medium">
                    Clicks over the last 30 days
                  </h2>
                  <div className="mt-4">
                    <ClickChart data={data.daily} />
                  </div>
                </section>
                <div className="grid gap-6 lg:grid-cols-2">
                  <section
                    aria-labelledby="referrers-heading"
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <h2 id="referrers-heading" className="text-sm font-medium">
                      Top referrers
                    </h2>
                    <div className="mt-4">
                      <ReferrerTable referrers={data.referrers} />
                    </div>
                  </section>
                  <section
                    aria-labelledby="browsers-heading"
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <h2 id="browsers-heading" className="text-sm font-medium">
                      Browsers
                    </h2>
                    <div className="mt-4">
                      <BreakdownBars
                        data={data.browsers.map((b) => ({
                          label: b.browser,
                          count: b.count,
                        }))}
                      />
                    </div>
                  </section>
                  <section
                    aria-labelledby="devices-heading"
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <h2 id="devices-heading" className="text-sm font-medium">
                      Devices
                    </h2>
                    <div className="mt-4">
                      <BreakdownBars
                        data={data.devices.map((d) => ({
                          label: d.deviceType,
                          count: d.count,
                        }))}
                      />
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Loading placeholder mirroring the real layout (stat tiles, chart, two
// breakdown cards) so the page doesn't jump when data arrives. The pulsing blocks
// are aria-hidden; the sr-only status announces loading to assistive tech.
function AnalyticsSkeleton() {
  const block = 'animate-pulse rounded-lg border border-border bg-card'
  return (
    <div>
      <p role="status" className="sr-only">
        Loading analytics…
      </p>
      <div aria-hidden="true" className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={`h-24 ${block}`} />
          <div className={`h-24 ${block}`} />
        </div>
        <div className={`h-80 ${block}`} />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`h-48 ${block}`} />
          <div className={`h-48 ${block}`} />
          <div className={`h-48 ${block}`} />
        </div>
      </div>
    </div>
  )
}

// A single headline metric (SPEC §3.3 total clicks). tabular-nums keeps the
// digits aligned; toLocaleString adds thousands separators.
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}
