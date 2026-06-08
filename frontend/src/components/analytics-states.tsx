import { Link } from '@tanstack/react-router'
import { ApiError } from '@/lib/api'

// Analytics detail states (SPEC §10), extracted from the link analytics route so
// they can be rendered and asserted in isolation.

// Empty state for a link that exists but has no clicks yet — friendlier than an
// empty chart and zeroed-out tables.
export function NoClicksState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <h2 className="text-base font-medium">No clicks yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Share this short link to start collecting clicks — analytics will appear
        here.
      </p>
    </div>
  )
}

// Map a failed analytics fetch to user-facing copy. 404/403 are terminal (the
// link is gone or not theirs), so they get a "Back to dashboard" action instead of
// a pointless retry; everything else (5xx / network) is retryable (SPEC §10).
function describeError(error: Error): {
  title: string
  message: string
  retryable: boolean
} {
  if (error instanceof ApiError && error.status === 404) {
    return {
      title: 'Link not found',
      message: 'This link doesn’t exist or may have been deleted.',
      retryable: false,
    }
  }
  if (error instanceof ApiError && error.status === 403) {
    return {
      title: 'Access denied',
      message: 'You don’t have permission to view this link’s analytics.',
      retryable: false,
    }
  }
  return {
    title: 'Analytics unavailable',
    message: 'We couldn’t load analytics for this link. Please try again.',
    retryable: true,
  }
}

// "Analytics unavailable" state (SPEC §10), shown when the analytics query fails.
export function AnalyticsUnavailable({
  error,
  onRetry,
}: {
  error: Error
  onRetry: () => void
}) {
  const { title, message, retryable } = describeError(error)
  const actionClass =
    'mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center"
    >
      <h2 className="text-base font-medium text-foreground">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {message}
      </p>
      {retryable ? (
        <button type="button" onClick={onRetry} className={actionClass}>
          Try again
        </button>
      ) : (
        <Link to="/dashboard" className={actionClass}>
          Back to dashboard
        </Link>
      )}
    </div>
  )
}
