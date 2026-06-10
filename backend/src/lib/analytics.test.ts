import { describe, expect, test } from 'bun:test'
import { toBrowsers, toDevices, toReferrers } from './analytics'

// These mappers carry the analytics labelling logic the SQL can't express:
// turning a null referrer into "Direct" and applying the browser/device
// fallbacks. The grouped SQL aggregation itself is validated against a real
// database (not unit-tested under the stub-the-DB setup).

describe('toReferrers', () => {
  test('maps a null referrer (direct navigation) to "Direct"', () => {
    expect(toReferrers([{ referrer: null, count: 3 }])).toEqual([
      { referrer: 'Direct', count: 3 },
    ])
  })

  test('passes named referrers through and preserves the query order', () => {
    const rows = [
      { referrer: 'https://news.example.com', count: 10 },
      { referrer: null, count: 4 },
      { referrer: 'https://t.co', count: 1 },
    ]
    expect(toReferrers(rows)).toEqual([
      { referrer: 'https://news.example.com', count: 10 },
      { referrer: 'Direct', count: 4 },
      { referrer: 'https://t.co', count: 1 },
    ])
  })

  test('returns an empty array when there are no clicks', () => {
    expect(toReferrers([])).toEqual([])
  })
})

describe('toBrowsers', () => {
  test('applies the "Other" fallback to a null browser', () => {
    expect(toBrowsers([{ browser: null, count: 2 }])).toEqual([
      { browser: 'Other', count: 2 },
    ])
  })

  test('passes parsed browser labels through unchanged', () => {
    expect(
      toBrowsers([
        { browser: 'Chrome', count: 5 },
        { browser: 'Firefox', count: 2 },
      ]),
    ).toEqual([
      { browser: 'Chrome', count: 5 },
      { browser: 'Firefox', count: 2 },
    ])
  })
})

describe('toDevices', () => {
  test('applies the "Desktop" fallback to a null deviceType', () => {
    expect(toDevices([{ deviceType: null, count: 7 }])).toEqual([
      { deviceType: 'Desktop', count: 7 },
    ])
  })

  test('passes parsed device labels through unchanged', () => {
    expect(
      toDevices([
        { deviceType: 'Mobile', count: 4 },
        { deviceType: 'Tablet', count: 1 },
      ]),
    ).toEqual([
      { deviceType: 'Mobile', count: 4 },
      { deviceType: 'Tablet', count: 1 },
    ])
  })
})
