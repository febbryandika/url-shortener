const DAYS = 30

export type DailyPoint = { date: string; count: number }

// Build the last 30 calendar days as YYYY-MM-DD in UTC (to line up with the
// backend's date_trunc('day', clicked_at)::date) and map the returned counts on,
// defaulting missing days to 0 so the chart always renders 30 bars (SPEC §6).
export function fillDailySeries(data: DailyPoint[]): DailyPoint[] {
  const counts = new Map(data.map((d) => [d.date, d.count]))
  const series: DailyPoint[] = []
  const today = new Date()
  for (let i = DAYS - 1; i >= 0; i--) {
    const day = new Date(today)
    day.setUTCDate(day.getUTCDate() - i)
    const date = day.toISOString().slice(0, 10)
    series.push({ date, count: counts.get(date) ?? 0 })
  }
  return series
}
