import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/dashboard-layout'
import { CreateLinkForm } from '@/components/create-link-form'
import { requireSession } from '@/lib/auth-guard'
import { RouteErrorBoundary } from '@/components/route-error-boundary'

export const Route = createFileRoute('/links/new')({
  beforeLoad: requireSession,
  component: NewLinkPage,
  errorComponent: RouteErrorBoundary,
})

function NewLinkPage() {
  return (
    <DashboardLayout>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create link</h1>
        <p className="text-sm text-muted-foreground">
          Shorten a URL with an optional title, custom slug, and expiry.
        </p>
      </div>

      <div className="mt-8 max-w-xl">
        <CreateLinkForm />
      </div>
    </DashboardLayout>
  )
}
