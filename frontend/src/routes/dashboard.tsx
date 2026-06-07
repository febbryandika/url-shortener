import { createFileRoute, Link } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/dashboard-layout'
import { LinkCard } from '@/components/link-card'
import { useLinks } from '@/hooks/use-links'
import { requireSession } from '@/lib/auth-guard'
import { RouteErrorBoundary } from '@/components/route-error-boundary'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireSession,
  component: DashboardPage,
  errorComponent: RouteErrorBoundary,
})

function DashboardPage() {
  const { data, isPending, isError, error, refetch } = useLinks()

  function handleRetry() {
    refetch()
  }

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your short links and view their analytics.
          </p>
        </div>
        <Link
          to="/links/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon />
          Create link
        </Link>
      </div>

      <section aria-labelledby="links-heading" className="mt-8">
        <h2 id="links-heading" className="sr-only">
          Your links
        </h2>

        {isPending ? (
          <LinkListSkeleton />
        ) : isError ? (
          <ErrorState message={error.message} onRetry={handleRetry} />
        ) : data.links.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.links.map((link) => (
              <li key={link.id}>
                <LinkCard link={link} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  )
}

function LinkListSkeleton() {
  return (
    <div>
      <p role="status" className="sr-only">
        Loading your links…
      </p>
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        {['a', 'b', 'c', 'd'].map((id) => (
          <li
            key={id}
            className="h-32 animate-pulse rounded-lg border border-border bg-card"
          />
        ))}
      </ul>
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center"
    >
      <h3 className="text-base font-medium text-foreground">
        Couldn&apos;t load your links
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <h3 className="text-base font-medium">No links yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Your short links will appear here once you create them.
      </p>
      <Link
        to="/links/new"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        <PlusIcon />
        Create your first link
      </Link>
    </div>
  )
}

function PlusIcon() {
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
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
