import { createFileRoute } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/dashboard-layout'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage your short links and view their analytics.
        </p>
      </div>

      <section
        aria-labelledby="links-heading"
        className="mt-8 rounded-lg border border-dashed border-border p-10 text-center"
      >
        <h2 id="links-heading" className="text-base font-medium">
          No links yet
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Your short links will appear here once you create them.
        </p>
      </section>
    </DashboardLayout>
  )
}
