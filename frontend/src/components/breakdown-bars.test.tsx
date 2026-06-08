import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { BreakdownBars } from './breakdown-bars'

describe('BreakdownBars', () => {
  it('renders each item and sorts by count descending', () => {
    render(
      <BreakdownBars
        data={[
          { label: 'Firefox', count: 2 },
          { label: 'Chrome', count: 8 },
        ]}
      />,
    )

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    // sorted desc → Chrome (8) before Firefox (2)
    expect(within(items[0]).getByText('Chrome')).toBeInTheDocument()
    expect(within(items[1]).getByText('Firefox')).toBeInTheDocument()
  })

  it('shows an empty message when there is no data', () => {
    render(<BreakdownBars data={[]} />)
    expect(screen.getByText(/no data yet/i)).toBeInTheDocument()
  })
})
