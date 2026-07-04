import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import * as React from 'react'

import { CreditModal } from './credit-modal'

// Radix Dialog relies on pointer-capture + scrollIntoView, which happy-dom lacks.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
    Element.prototype.setPointerCapture = () => {}
    Element.prototype.releasePointerCapture = () => {}
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
})

describe('CreditModal', () => {
  it('renders nothing when closed', () => {
    render(<CreditModal open={false} onClose={() => {}} />)
    expect(screen.queryByText('Credits & balance')).toBeNull()
  })

  it('shows the trial + prepaid buckets distinctly with a clear total', () => {
    render(
      <CreditModal open onClose={() => {}} trialBalanceCents={500} prepaidBalanceCents={1234} />,
    )
    // Two distinct buckets.
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    expect(screen.getByText('$12.34')).toBeInTheDocument()
    // Combined breakdown + explicit total.
    expect(screen.getByText('$5.00 trial + $12.34 credits')).toBeInTheDocument()
    expect(screen.getByText('Total $17.34')).toBeInTheDocument()
  })

  it('shows the welcome celebration for new users', () => {
    render(
      <CreditModal
        open
        onClose={() => {}}
        isNewUser
        trialGrantedCents={500}
        trialBalanceCents={500}
      />,
    )
    expect(screen.getByText("You've got $5.00 in free credits")).toBeInTheDocument()
  })

  it('calls onTopUp with the preset amount in cents', () => {
    const onTopUp = vi.fn()
    render(<CreditModal open onClose={() => {}} onTopUp={onTopUp} topUpOptions={[1000, 2500]} />)
    fireEvent.click(screen.getByText('$25.00'))
    expect(onTopUp).toHaveBeenCalledWith(2500)
  })

  it('converts a custom dollar amount to cents before calling onTopUp', () => {
    const onTopUp = vi.fn()
    render(<CreditModal open onClose={() => {}} onTopUp={onTopUp} topUpOptions={[]} />)
    fireEvent.change(screen.getByPlaceholderText('Custom amount'), { target: { value: '7.50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onTopUp).toHaveBeenCalledWith(750)
  })

  it('does not call onTopUp while busy', () => {
    const onTopUp = vi.fn()
    render(<CreditModal open onClose={() => {}} onTopUp={onTopUp} topUpOptions={[1000]} busy />)
    fireEvent.click(screen.getByText('$10.00'))
    expect(onTopUp).not.toHaveBeenCalled()
  })

  it('hides the top-up affordance when no onTopUp is supplied', () => {
    render(<CreditModal open onClose={() => {}} prepaidBalanceCents={1000} />)
    expect(screen.queryByText('Add credits')).toBeNull()
  })

  it('surfaces an error message', () => {
    render(<CreditModal open onClose={() => {}} error="Card declined" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Card declined')
  })
})
