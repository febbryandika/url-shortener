import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './dashboard-states'

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
