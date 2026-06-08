import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { NotFound, RouteErrorBoundary } from '@/components/route-error-boundary'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  // Global safety net (SPEC §12): catches render errors in routes without their own
  // boundary (index, login) and any thrown notFound(); the dashboard routes still
  // override errorComponent with the same component.
  errorComponent: RouteErrorBoundary,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return <Outlet />
}
