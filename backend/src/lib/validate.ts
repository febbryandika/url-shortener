import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { ZodSchema } from 'zod'
import { formatZodError } from './schemas'

// Thin wrapper over @hono/zod-validator that returns our structured
// { error, code } response on failure instead of the library's default. The
// generics forward to zValidator, so `c.req.valid(target)` stays fully typed
// (and flows through to the RPC client). Usage:
//
//   app.post('/links', validate('json', createLinkSchema), (c) => {
//     const body = c.req.valid('json') // typed as CreateLinkInput
//   })
export function validate<
  Target extends keyof ValidationTargets,
  Schema extends ZodSchema,
>(target: Target, schema: Schema) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        { error: formatZodError(result.error), code: 'VALIDATION_ERROR' },
        400,
      )
    }
  })
}
