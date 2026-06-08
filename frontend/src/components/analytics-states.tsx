// Analytics detail states (SPEC §10), extracted from the link analytics route so
// they can be rendered and asserted in isolation.

// Empty state for a link that exists but has no clicks yet — friendlier than an
// empty chart and zeroed-out tables.
export function NoClicksState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <h2 className="text-base font-medium">No clicks yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Share this short link to start collecting clicks — analytics will appear
        here.
      </p>
    </div>
  )
}
