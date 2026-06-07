import { Link } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

// Route-level error boundary (SPEC §12) — the safety net for unexpected render
// errors in the authenticated routes. Recoverable data-fetch failures are handled
// inline by each page (e.g. the analytics "unavailable" state); this catches the
// rest. `reset` retries rendering the route; the dashboard link is a way out.
export function RouteErrorBoundary({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        role="alert"
        className="w-full max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center"
      >
        <h1 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

// Root not-found screen (SPEC §12) — shown for any unmatched in-app route. A 404
// isn't an error, so it uses neutral card styling rather than the destructive
// boundary above. Wired as the router's notFoundComponent in __root.tsx.
export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <div className="mt-5 flex items-center justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
