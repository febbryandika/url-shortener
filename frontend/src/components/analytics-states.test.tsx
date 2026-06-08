import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoClicksState } from './analytics-states'

describe('NoClicksState (analytics)', () => {
  it('explains there are no clicks yet', () => {
    render(<NoClicksState />)
    expect(screen.getByText(/no clicks yet/i)).toBeInTheDocument()
  })
})
