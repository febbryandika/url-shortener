type Referrer = { referrer: string; count: number }

// Top referrers (SPEC §3.3/§6). The backend already returns at most 5 rows sorted
// by count desc and maps a null referrer to "Direct", so this just renders them.
// table-fixed + truncate keeps long referrer URLs from blowing out the layout.
export function ReferrerTable({ referrers }: { referrers: Referrer[] }) {
  if (referrers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No referrer data yet.</p>
    )
  }

  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th scope="col" className="pb-2 font-medium">
            Referrer
          </th>
          <th scope="col" className="w-20 pb-2 text-right font-medium">
            Clicks
          </th>
        </tr>
      </thead>
      <tbody>
        {referrers.map((r) => (
          <tr key={r.referrer} className="border-b border-border last:border-0">
            <td className="truncate py-2 pr-4" title={r.referrer}>
              {r.referrer}
            </td>
            <td className="py-2 text-right tabular-nums">
              {r.count.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
