import { createFileRoute, Link } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useLinkAnalytics } from '@/hooks/use-analytics'
import { useLinks } from '@/hooks/use-links'
import { requireSession } from '@/lib/auth-guard'

export const Route = createFileRoute('/links/$id')({
  beforeLoad: requireSession,
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { id } = Route.useParams()
  const { data, isPending, isError, error } = useLinkAnalytics(id)

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
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        {link && (
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            {link.shortUrl}
          </a>
        )}
      </div>

      <div className="mt-8">
        {isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            Loading analytics…
          </p>
        ) : isError ? (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        ) : (
          // Placeholder — replaced by the stat tiles, chart, and breakdowns in the
          // following tasks.
          <p className="text-sm text-muted-foreground">
            Total clicks: {data.totalClicks}
          </p>
        )}
      </div>
    </DashboardLayout>
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
