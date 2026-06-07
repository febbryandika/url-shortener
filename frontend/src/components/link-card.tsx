import { useRef } from 'react'
import type { MouseEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { ApiError } from '@/lib/api'
import { useDeleteLink } from '@/hooks/use-links'
import { EditLinkDialog } from '@/components/edit-link-dialog'
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

function TrashIcon() {
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
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
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
  const deleteLink = useDeleteLink()
  const confirmRef = useRef<HTMLDialogElement>(null)
  // `||` (not `??`) so an empty-string title also falls back to the slug.
  const label = link.title || link.slug

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link.shortUrl)
      toast.success('Short link copied to clipboard')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  function openConfirm() {
    confirmRef.current?.showModal()
  }

  function closeConfirm() {
    confirmRef.current?.close()
  }

  function handleConfirmBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === confirmRef.current) closeConfirm()
  }

  function handleDelete() {
    deleteLink.mutate(link.id, {
      onSuccess: () => {
        toast.success('Link deleted')
        closeConfirm()
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete link',
        )
      },
    })
  }

  return (
    <>
      <article className="flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-medium leading-tight">
            <Link
              to="/links/$id"
              params={{ id: link.id }}
              className="hover:underline"
            >
              {label}
            </Link>
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

        <div className="mt-auto flex items-center gap-2 pt-1">
          {expiry && (
            <span
              className={cn(
                'text-xs',
                expiry.expired ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {expiry.text}
            </span>
          )}
          <div className="ml-auto flex items-center gap-0.5">
            <EditLinkDialog link={link} />
            <button
              type="button"
              onClick={openConfirm}
              aria-label={`Delete ${label}`}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </article>

      <dialog
        ref={confirmRef}
        aria-labelledby={`delete-title-${link.id}`}
        onClick={handleConfirmBackdrop}
        className="m-auto w-[90vw] max-w-sm rounded-lg p-0 backdrop:bg-black/50"
      >
        <div className="bg-card p-6 text-foreground">
          <h2 id={`delete-title-${link.id}`} className="text-base font-semibold">
            Delete link?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This permanently deletes{' '}
            <span className="font-medium text-foreground">{label}</span> and all
            of its click data. This can&apos;t be undone.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeConfirm}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLink.isPending}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleteLink.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
