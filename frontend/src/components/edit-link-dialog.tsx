import { useRef } from 'react'
import type { MouseEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useUpdateLink } from '@/hooks/use-links'
import { ApiError } from '@/lib/api'
import { titleSchema } from '../../../backend/src/lib/schemas'
import type { LinkListItem } from '../../../backend/src/lib/schemas'

// Only title + expiry are editable (SPEC §3.1); slug and url are immutable.
const editLinkFormSchema = z.object({
  title: titleSchema,
  expiresAt: z.string(),
})

type EditLinkFormValues = z.infer<typeof editLinkFormSchema>

// Convert a stored ISO timestamp into the value `<input type="datetime-local">`
// expects (local `YYYY-MM-DDTHH:mm`), or '' when there's no expiry.
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const localMs = date.getTime() - date.getTimezoneOffset() * 60_000
  return new Date(localMs).toISOString().slice(0, 16)
}

function defaultsFor(link: LinkListItem): EditLinkFormValues {
  return { title: link.title ?? '', expiresAt: toDatetimeLocal(link.expiresAt) }
}

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

function PencilIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function EditLinkDialog({ link }: { link: LinkListItem }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const updateLink = useUpdateLink()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditLinkFormValues>({
    resolver: zodResolver(editLinkFormSchema),
    defaultValues: defaultsFor(link),
  })

  function openDialog() {
    // Re-seed from the link's current values each open (no useEffect needed).
    reset(defaultsFor(link))
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) closeDialog()
  }

  function onSubmit(values: EditLinkFormValues) {
    const input = {
      title: values.title,
      expiresAt: values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : null,
    }

    updateLink.mutate(
      { id: link.id, input },
      {
        onSuccess: () => {
          toast.success('Link updated')
          closeDialog()
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError ? error.message : 'Failed to update link',
          )
        },
      },
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-label={`Edit ${link.title || link.slug}`}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <PencilIcon />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`edit-title-${link.id}`}
        onClick={handleBackdrop}
        className="m-auto w-[90vw] max-w-md rounded-lg p-0 backdrop:bg-black/50"
      >
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card p-6 text-foreground"
        >
          <h2 id={`edit-title-${link.id}`} className="text-base font-semibold">
            Edit link
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The short link (
            <span className="font-medium text-foreground">/{link.slug}</span>)
            and destination can&apos;t be changed.
          </p>

          <div className="mt-4 space-y-4">
            <div className="space-y-1">
              <label
                htmlFor={`edit-title-input-${link.id}`}
                className="text-sm font-medium"
              >
                Title{' '}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id={`edit-title-input-${link.id}`}
                type="text"
                placeholder="My link"
                aria-invalid={errors.title ? true : undefined}
                aria-describedby={
                  errors.title ? `edit-title-error-${link.id}` : undefined
                }
                className={inputClass}
                {...register('title')}
              />
              {errors.title && (
                <p
                  id={`edit-title-error-${link.id}`}
                  className="text-sm text-destructive"
                >
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`edit-expiry-${link.id}`}
                className="text-sm font-medium"
              >
                Expiry{' '}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id={`edit-expiry-${link.id}`}
                type="datetime-local"
                className={inputClass}
                {...register('expiresAt')}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiry.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateLink.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {updateLink.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
