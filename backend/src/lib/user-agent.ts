// User-Agent parsing for click analytics (SPEC §3.2). Pure string functions with
// no request/runtime deps, so they stay trivially unit-testable (SPEC §11).

// Browser — checked in SPEC's order so shared substrings don't cause false
// positives: Edge UAs contain "Chrome", and Chrome UAs contain "Safari".
export function parseBrowser(ua: string): string {
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  return 'Other'
}

// Device type — SPEC §3.2 keyword rules. Tablet is checked before Mobile because
// iPad UAs also contain "Mobile"; checking Tablet first keeps iPads classified as
// Tablet. (SPEC fixes the check order only for browsers, so this resolves the
// device-keyword overlap toward the clear iPad → Tablet intent.)
export function parseDeviceType(ua: string): string {
  if (ua.includes('iPad') || ua.includes('Tablet')) return 'Tablet'
  if (ua.includes('Mobile') || ua.includes('Android')) return 'Mobile'
  return 'Desktop'
}
