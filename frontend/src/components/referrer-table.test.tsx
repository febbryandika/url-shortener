import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReferrerTable } from './referrer-table'

describe('ReferrerTable', () => {
  it('renders a row per referrer with its click count', () => {
    render(
      <ReferrerTable
        referrers={[
          { referrer: 'https://news.example.com', count: 12 },
          // null referrers arrive already mapped to "Direct" from the backend
          { referrer: 'Direct', count: 5 },
        ]}
      />,
    )

    expect(screen.getByText('https://news.example.com')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Direct')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows an empty message when there is no referrer data', () => {
    render(<ReferrerTable referrers={[]} />)
    expect(screen.getByText(/no referrer data yet/i)).toBeInTheDocument()
  })
})
