import type { auth } from './lib/auth'

// requireAuth (lib/middleware.ts) sets these on the Hono context via c.set().
// Declaring them here types c.get('user') / c.get('session') across all routes
// and flows through to the RPC client's inferred AppType.
declare module 'hono' {
  interface ContextVariableMap {
    user: typeof auth.$Infer.Session.user
    session: typeof auth.$Infer.Session.session
  }
}
