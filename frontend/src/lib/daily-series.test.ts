import { describe, expect, it } from 'vitest'
import { fillDailySeries } from './daily-series'

// today + offset as a YYYY-MM-DD UTC key (matches fillDailySeries' own formatting).
function utcDay(offsetFromToday: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offsetFromToday)
  return d.toISOString().slice(0, 10)
}

describe('fillDailySeries', () => {
  it('always returns 30 days in ascending order ending today (UTC)', () => {
    const series = fillDailySeries([])
    expect(series).toHaveLength(30)
    expect(series[0].date).toBe(utcDay(-29))
    expect(series[29].date).toBe(utcDay(0))
    const dates = series.map((d) => d.date)
    expect([...dates].sort()).toEqual(dates) // YYYY-MM-DD sorts chronologically
  })

  it('defaults days with no data to a count of 0', () => {
    const series = fillDailySeries([])
    expect(series.every((d) => d.count === 0)).toBe(true)
  })

  it('maps provided counts onto their matching days', () => {
    const series = fillDailySeries([
      { date: utcDay(0), count: 5 },
      { date: utcDay(-10), count: 3 },
    ])
    expect(series.find((d) => d.date === utcDay(0))?.count).toBe(5)
    expect(series.find((d) => d.date === utcDay(-10))?.count).toBe(3)
    expect(series.find((d) => d.date === utcDay(-1))?.count).toBe(0)
  })

  it('ignores dates outside the 30-day window', () => {
    const series = fillDailySeries([{ date: utcDay(-100), count: 9 }])
    expect(series.reduce((sum, d) => sum + d.count, 0)).toBe(0)
  })
})
