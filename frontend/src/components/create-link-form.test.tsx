import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateLinkForm } from './create-link-form'

// Isolate the form's validation logic from data fetching, routing and toasts so
// the tests exercise only the Zod schema + react-hook-form wiring.
const mutate = vi.fn()

vi.mock('@/hooks/use-links', () => ({
  useCreateLink: () => ({ mutate, isPending: false }),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

beforeEach(() => {
  mutate.mockClear()
})

describe('CreateLinkForm validation', () => {
  it('blocks submit and flags the URL field when it is empty', async () => {
    const user = userEvent.setup()
    render(<CreateLinkForm />)

    await user.click(screen.getByRole('button', { name: /create link/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: /destination url/i }),
      ).toHaveAttribute('aria-invalid', 'true'),
    )
    expect(mutate).not.toHaveBeenCalled()
  })

  it('rejects a non-http(s) URL', async () => {
    const user = userEvent.setup()
    render(<CreateLinkForm />)

    await user.type(
      screen.getByRole('textbox', { name: /destination url/i }),
      'javascript:alert(1)',
    )
    await user.click(screen.getByRole('button', { name: /create link/i }))

    expect(await screen.findByText(/must start with http/i)).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('rejects an invalid custom slug', async () => {
    const user = userEvent.setup()
    render(<CreateLinkForm />)

    await user.type(
      screen.getByRole('textbox', { name: /destination url/i }),
      'https://example.com',
    )
    await user.click(screen.getByRole('radio', { name: /custom slug/i }))
    const slugInput = await screen.findByRole('textbox', {
      name: /custom slug/i,
    })
    await user.type(slugInput, 'Bad Slug')
    await user.click(screen.getByRole('button', { name: /create link/i }))

    expect(
      await screen.findByText(/lowercase letters, numbers, and hyphens/i),
    ).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits a valid auto-slug link with the expected payload', async () => {
    const user = userEvent.setup()
    render(<CreateLinkForm />)

    await user.type(
      screen.getByRole('textbox', { name: /destination url/i }),
      'https://example.com',
    )
    await user.click(screen.getByRole('button', { name: /create link/i }))

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1))
    expect(mutate.mock.calls[0][0]).toEqual({ url: 'https://example.com' })
  })
})
