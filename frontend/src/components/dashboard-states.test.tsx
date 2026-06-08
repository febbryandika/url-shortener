import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState, ErrorState } from './dashboard-states'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

describe('EmptyState (dashboard)', () => {
  it('invites the user to create their first link', () => {
    render(<EmptyState />)

    expect(screen.getByText(/no links yet/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /create your first link/i }),
    ).toHaveAttribute('href', '/links/new')
  })
})

describe('ErrorState (dashboard)', () => {
  it('shows the failure message and retries on demand', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorState message="Network down" onRetry={onRetry} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Network down')
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
