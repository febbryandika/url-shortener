import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useCreateLink } from '@/hooks/use-links'
import { ApiError } from '@/lib/api'
import {
  slugSchema,
  titleSchema,
  urlSchema,
  type CreateLinkInput,
} from '../../../backend/src/lib/schemas'

// Form schema reuses the shared field schemas so client validation matches the
// server. `slug` is only validated when the user picks "custom" mode; `expiresAt`
// is a datetime-local string converted to ISO on submit (the server wants ISO).
const createLinkFormSchema = z
  .object({
    url: urlSchema,
    title: titleSchema,
    slugMode: z.enum(['auto', 'custom']),
    slug: z.string(),
    expiresAt: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.slugMode === 'custom') {
      const result = slugSchema.safeParse(values.slug)
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slug'],
          message: result.error.issues[0]?.message ?? 'Invalid slug',
        })
      }
    }
  })

type CreateLinkFormValues = z.infer<typeof createLinkFormSchema>

const inputClass =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

export function CreateLinkForm() {
  const navigate = useNavigate()
  const createLink = useCreateLink()
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateLinkFormValues>({
    resolver: zodResolver(createLinkFormSchema),
    defaultValues: {
      url: '',
      title: '',
      slugMode: 'auto',
      slug: '',
      expiresAt: '',
    },
  })

  const slugMode = watch('slugMode')

  function onSubmit(values: CreateLinkFormValues) {
    const input: CreateLinkInput = {
      url: values.url,
      ...(values.slugMode === 'custom' ? { slug: values.slug } : {}),
      ...(values.title ? { title: values.title } : {}),
      ...(values.expiresAt
        ? { expiresAt: new Date(values.expiresAt).toISOString() }
        : {}),
    }

    createLink.mutate(input, {
      onSuccess: () => {
        toast.success('Link created')
        navigate({ to: '/dashboard' })
      },
      onError: (error) => {
        // A taken custom slug can only be known server-side — surface it inline on
        // the slug field as well as a toast (SPEC §10).
        if (error instanceof ApiError && error.code === 'SLUG_TAKEN') {
          setError('slug', { message: error.message })
        }
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to create link',
        )
      },
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <label htmlFor="url" className="text-sm font-medium">
          Destination URL
        </label>
        <input
          id="url"
          type="url"
          placeholder="https://example.com/page"
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? 'url-error' : undefined}
          className={inputClass}
          {...register('url')}
        />
        {errors.url && (
          <p id="url-error" className="text-sm text-destructive">
            {errors.url.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="title"
          type="text"
          placeholder="My link"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className={inputClass}
          {...register('title')}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Short link</legend>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="auto" {...register('slugMode')} />
            Auto-generate
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="custom" {...register('slugMode')} />
            Custom slug
          </label>
        </div>
      </fieldset>

      {slugMode === 'custom' && (
        <div className="space-y-1">
          <label htmlFor="slug" className="text-sm font-medium">
            Custom slug
          </label>
          <input
            id="slug"
            type="text"
            placeholder="my-link"
            aria-invalid={errors.slug ? true : undefined}
            aria-describedby={errors.slug ? 'slug-error' : 'slug-hint'}
            className={inputClass}
            {...register('slug')}
          />
          {errors.slug ? (
            <p id="slug-error" className="text-sm text-destructive">
              {errors.slug.message}
            </p>
          ) : (
            <p id="slug-hint" className="text-xs text-muted-foreground">
              3–32 characters: lowercase letters, numbers, and hyphens.
            </p>
          )}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="expiresAt" className="text-sm font-medium">
          Expiry{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="expiresAt"
          type="datetime-local"
          className={inputClass}
          {...register('expiresAt')}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={createLink.isPending}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createLink.isPending ? 'Creating…' : 'Create link'}
        </button>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
