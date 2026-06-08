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
import { fillDailySeries, type DailyPoint } from '@/lib/daily-series'

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
    <div className="w-full">
      <ResponsiveContainer width="100%" height={288}>
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
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
