import { z } from 'zod'

// Validate required environment variables at startup so the app fails fast
// with a clear message instead of a cryptic error deep in a DB call.
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ')
  throw new Error(`Invalid environment configuration — ${issues}`)
}

export const env = parsed.data
