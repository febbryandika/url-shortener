import { Link } from '@tanstack/react-router'

// Dashboard list states (SPEC §10), extracted from the dashboard route so they can
// be rendered and asserted in isolation.

// Shown when the user has no links yet — invites them to create their first one.
export function EmptyState() {
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
        Create your first link
      </Link>
    </div>
  )
}

// Shown when the links list fails to load — surfaces the error and offers a retry.
export function ErrorState({
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
