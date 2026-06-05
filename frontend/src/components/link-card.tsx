import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { LinkListItem } from '../../../backend/src/lib/schemas'

function CopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  )
}

type ExpiryStatus = { text: string; expired: boolean }

// Derive the expiry label during render (no state): expired links read in the
// destructive colour, future ones show the date, no-expiry links show nothing.
function getExpiryStatus(expiresAt: string | null): ExpiryStatus | null {
  if (!expiresAt) return null
  const expired = new Date(expiresAt).getTime() < Date.now()
  return {
    expired,
    text: expired
      ? 'Expired'
      : `Expires ${new Date(expiresAt).toLocaleDateString()}`,
  }
}

export function LinkCard({ link }: { link: LinkListItem }) {
  const expiry = getExpiryStatus(link.expiresAt)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link.shortUrl)
      toast.success('Short link copied to clipboard')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <article className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 font-medium leading-tight">
          {link.title ?? link.slug}
        </h3>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {link.clickCount} {link.clickCount === 1 ? 'click' : 'clicks'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm font-medium text-primary hover:underline"
        >
          {link.shortUrl}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy short link to clipboard"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <CopyIcon />
        </button>
      </div>

      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        title={link.url}
        className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <span className="truncate">{link.url}</span>
        <ExternalLinkIcon />
      </a>

      {expiry && (
        <p
          className={cn(
            'mt-auto text-xs',
            expiry.expired ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {expiry.text}
        </p>
      )}
    </article>
  )
}
