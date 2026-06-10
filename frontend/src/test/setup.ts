// Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.) on
// Vitest's expect, and unmounts the rendered tree after each test so cases stay
// isolated. Loaded via `setupFiles` in vitest.config.ts.
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
