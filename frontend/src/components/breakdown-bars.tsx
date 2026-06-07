type BreakdownItem = { label: string; count: number }

// A simple, dependency-free breakdown list: each row shows a label, its count, the
// share of the total, and a proportion bar scaled to the largest count. Used for
// the browser breakdown (SPEC §3.3); rows are sorted by count desc for readability.
export function BreakdownBars({ data }: { data: BreakdownItem[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>
  }

  const sorted = [...data].sort((a, b) => b.count - a.count)
  const max = sorted[0].count || 1
  const total = sorted.reduce((sum, d) => sum + d.count, 0) || 1

  return (
    <ul className="space-y-3">
      {sorted.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {item.count.toLocaleString()}{' '}
              <span className="text-xs">
                ({Math.round((item.count / total) * 100)}%)
              </span>
            </span>
          </div>
          <div
            aria-hidden="true"
            className="mt-1 h-2 overflow-hidden rounded-full bg-secondary"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
