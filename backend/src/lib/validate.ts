import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { ZodSchema } from 'zod'
import { ApiError } from './errors'
import { formatZodError } from './schemas'

// Thin wrapper over @hono/zod-validator. On failure it throws a typed ApiError
// so validation errors funnel through the same central errorHandler as every
// other error — one structured { error, code } path. The generics forward to
// zValidator, so `c.req.valid(target)` stays fully typed (and flows through to
// the RPC client). Usage:
//
//   app.post('/links', validate('json', createLinkSchema), (c) => {
//     const body = c.req.valid('json') // typed as CreateLinkInput
//   })
export function validate<
  Target extends keyof ValidationTargets,
  Schema extends ZodSchema,
>(target: Target, schema: Schema) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', formatZodError(result.error))
    }
  })
}
