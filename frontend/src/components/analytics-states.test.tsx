import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/lib/api'
import { AnalyticsUnavailable, NoClicksState } from './analytics-states'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

describe('NoClicksState (analytics)', () => {
  it('explains there are no clicks yet', () => {
    render(<NoClicksState />)
    expect(screen.getByText(/no clicks yet/i)).toBeInTheDocument()
  })
})

describe('AnalyticsUnavailable (analytics)', () => {
  it('offers a retry for a transient (non-API) failure', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<AnalyticsUnavailable error={new Error('boom')} onRetry={onRetry} />)

    expect(screen.getByText(/analytics unavailable/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows a back-to-dashboard link and no retry for a 404', () => {
    render(
      <AnalyticsUnavailable
        error={new ApiError(404, 'NOT_FOUND', 'Link not found')}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText(/link not found/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to dashboard/i }),
    ).toHaveAttribute('href', '/dashboard')
    expect(
      screen.queryByRole('button', { name: /try again/i }),
    ).not.toBeInTheDocument()
  })

  it('denies access and offers no retry for a 403', () => {
    render(
      <AnalyticsUnavailable
        error={new ApiError(403, 'FORBIDDEN', 'Forbidden')}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText(/access denied/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /try again/i }),
    ).not.toBeInTheDocument()
  })
})
