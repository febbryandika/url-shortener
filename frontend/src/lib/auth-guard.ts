import { redirect } from '@tanstack/react-router'
import { authClient } from './auth-client'

// Route guard for authenticated pages: redirect to /login when there's no session.
// Used in a route's `beforeLoad` — a router guard, not a data loader.
export async function requireSession() {
  const { data } = await authClient.getSession()
  if (!data) {
    throw redirect({ to: '/login' })
  }
  return data
}

// Inverse guard for /login: send already-authenticated users to the dashboard.
export async function redirectIfAuthenticated() {
  const { data } = await authClient.getSession()
  if (data) {
    throw redirect({ to: '/dashboard' })
  }
}
