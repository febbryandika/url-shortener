import { describe, expect, test } from 'bun:test'
import { parseBrowser, parseDeviceType } from './user-agent'

// Real User-Agent strings, trimmed to the parts the parser keys on.
const UA = {
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0',
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
  androidPhone: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
}

describe('parseBrowser', () => {
  // Edge and Chrome UAs both contain "Chrome"; SPEC §3.2 checks Edge first.
  test('detects Edge even though its UA contains "Chrome"', () => {
    expect(parseBrowser(UA.edge)).toBe('Edge')
  })

  test('detects Chrome', () => {
    expect(parseBrowser(UA.chrome)).toBe('Chrome')
  })

  test('detects Firefox', () => {
    expect(parseBrowser(UA.firefox)).toBe('Firefox')
  })

  // Chrome UAs also contain "Safari"; Safari is only matched when Chrome is absent.
  test('detects Safari only when Chrome is absent', () => {
    expect(parseBrowser(UA.safari)).toBe('Safari')
  })

  test('falls back to Other for unknown / empty UAs', () => {
    expect(parseBrowser('curl/8.4.0')).toBe('Other')
    expect(parseBrowser('')).toBe('Other')
  })
})

describe('parseDeviceType', () => {
  // iPad UAs contain "Mobile"; SPEC's intent is Tablet, so Tablet is checked first.
  test('classifies iPad as Tablet despite "Mobile" in the UA', () => {
    expect(parseDeviceType(UA.ipad)).toBe('Tablet')
  })

  test('classifies a generic "Tablet" UA as Tablet', () => {
    expect(parseDeviceType('Mozilla/5.0 (Linux; Android 13; Tablet)')).toBe('Tablet')
  })

  test('classifies Android and iPhone as Mobile', () => {
    expect(parseDeviceType(UA.androidPhone)).toBe('Mobile')
    expect(parseDeviceType(UA.iphone)).toBe('Mobile')
  })

  test('falls back to Desktop for desktop / empty UAs', () => {
    expect(parseDeviceType(UA.desktop)).toBe('Desktop')
    expect(parseDeviceType('')).toBe('Desktop')
  })
})
