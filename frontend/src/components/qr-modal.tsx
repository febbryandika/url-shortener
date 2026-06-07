import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { toast } from 'sonner'

// The QR endpoint is public (SPEC §5/§7) and loaded as a plain image, so we point
// straight at the API origin — the same base the RPC client uses (lib/client.ts).
const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type QrStatus = 'loading' | 'loaded' | 'error'

function QrIcon() {
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
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  )
}

// QR code viewer (SPEC §6). Renders its own trigger + a native <dialog>; the QR is
// a plain <img> against the public endpoint. The image only mounts while the dialog
// is open, so dashboards with many cards don't each fetch a QR on load.
export function QrModal({ linkId, slug }: { linkId: string; slug: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<QrStatus>('loading')
  const [attempt, setAttempt] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const qrUrl = `${apiBase}/api/links/${linkId}/qr`
  // Cache-bust on retry only, so the first load (and the download) can reuse the
  // server's cached PNG.
  const imgSrc = attempt === 0 ? qrUrl : `${qrUrl}?retry=${attempt}`
  const titleId = `qr-title-${linkId}`

  function handleOpen() {
    setStatus('loading')
    setAttempt(0)
    setOpen(true)
    dialogRef.current?.showModal()
  }

  function handleClose() {
    dialogRef.current?.close()
  }

  // Fires for Esc, the Close button, and backdrop clicks alike — keep `open` in
  // sync so the image unmounts and re-fetches fresh on the next open.
  function handleDialogClose() {
    setOpen(false)
  }

  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) handleClose()
  }

  function handleImageLoad() {
    setStatus('loaded')
  }

  function handleImageError() {
    setStatus('error')
  }

  function handleRetry() {
    setStatus('loading')
    setAttempt((value) => value + 1)
  }

  // Download via a blob object-URL: a cross-origin <a download> is ignored for the
  // filename, so fetch the PNG and anchor-download the blob as {slug}-qr.png.
  async function handleDownload() {
    setDownloading(true)
    try {
      const response = await fetch(qrUrl)
      if (!response.ok) throw new Error(`Request failed (${response.status})`)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${slug}-qr.png`
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error('Could not download the QR code')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Show QR code for ${slug}`}
        title="Show QR code"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <QrIcon />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={handleDialogClose}
        onClick={handleBackdrop}
        className="m-auto w-[90vw] max-w-xs rounded-lg p-0 backdrop:bg-black/50"
      >
        {open && (
          <div className="bg-card p-6 text-foreground">
            <h2 id={titleId} className="text-base font-semibold">
              QR code
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan or download the QR code for{' '}
              <span className="font-medium text-foreground">/{slug}</span>.
            </p>

            <div className="mt-4 grid aspect-square w-full place-items-center overflow-hidden rounded-md border border-border bg-white">
              {status === 'error' ? (
                <div role="alert" className="p-6 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Couldn&apos;t load the QR code.
                  </p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-3 rounded-md border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {status === 'loading' && (
                    <div
                      role="status"
                      className="flex flex-col items-center gap-2"
                    >
                      <span
                        aria-hidden="true"
                        className="size-8 animate-spin rounded-full border-2 border-muted border-t-foreground"
                      />
                      <span className="sr-only">Loading QR code…</span>
                    </div>
                  )}
                  <img
                    key={attempt}
                    src={imgSrc}
                    alt={`QR code for /${slug}`}
                    width={512}
                    height={512}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    className={status === 'loaded' ? 'h-auto w-full' : 'hidden'}
                  />
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={status !== 'loaded' || downloading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {downloading ? 'Downloading…' : 'Download PNG'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  )
}
