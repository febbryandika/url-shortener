import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const DAYS = 30

type DailyPoint = { date: string; count: number }

// Build the last 30 calendar days as YYYY-MM-DD in UTC (to line up with the
// backend's date_trunc('day', clicked_at)::date) and map the returned counts on,
// defaulting missing days to 0 so the chart always renders 30 bars (SPEC §6).
function fillDailySeries(data: DailyPoint[]): DailyPoint[] {
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

// Format a YYYY-MM-DD key as a short label (e.g. "Jun 7"), parsed and rendered in
// UTC so it matches the UTC date keys above.
function formatDay(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

type ChartColors = {
  bar: string
  axis: string
  grid: string
  card: string
  text: string
}

// Recharts renders SVG and sets colours as presentation attributes, where CSS
// var() does not resolve — so read the design tokens off :root once and hand the
// chart concrete hsl() strings instead.
function useChartColors(): ChartColors {
  return useMemo(() => {
    const root = getComputedStyle(document.documentElement)
    const token = (name: string) => `hsl(${root.getPropertyValue(name).trim()})`
    return {
      bar: token('--primary'),
      axis: token('--muted-foreground'),
      grid: token('--border'),
      card: token('--card'),
      text: token('--foreground'),
    }
  }, [])
}

export function ClickChart({ data }: { data: DailyPoint[] }) {
  const colors = useChartColors()
  const series = useMemo(() => fillDailySeries(data), [data])

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={series}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fill: colors.axis, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.grid }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            width={36}
            tick={{ fill: colors.axis, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: colors.grid, opacity: 0.3 }}
            labelFormatter={(label) => formatDay(String(label))}
            contentStyle={{
              background: colors.card,
              border: `1px solid ${colors.grid}`,
              borderRadius: 8,
              color: colors.text,
              fontSize: 12,
            }}
          />
          <Bar
            name="Clicks"
            dataKey="count"
            fill={colors.bar}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
