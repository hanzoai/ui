'use client'

/**
 * @hanzo/checkout - CheckoutForm
 *
 * Complete checkout form component - similar to Stripe Checkout
 */

import React, { useState } from 'react'
import { useCheckout } from '../hooks/use-checkout'
import type { CheckoutAddress } from '../types'

// Using cn utility pattern from @hanzo/ui
const cn = (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' ')

interface CheckoutFormProps {
  /** Additional class names */
  className?: string

  /** Show order summary */
  showSummary?: boolean

  /** Enable express checkout (Apple Pay, Google Pay) */
  expressCheckout?: boolean

  /** Collect phone number */
  collectPhone?: boolean

  /** Custom submit button text */
  submitText?: string
}

export function CheckoutForm({
  className,
  showSummary = true,
  expressCheckout = true,
  collectPhone = false,
  submitText = 'Pay Now'
}: CheckoutFormProps) {
  const {
    session,
    step,
    isLoading,
    isProcessing,
    error,
    updateShipping,
    confirmPayment,
    nextStep,
    prevStep
  } = useCheckout()

  if (!session) {
    return (
      <div className={cn('hanzo-checkout-form hanzo-checkout-empty', className)}>
        <p>No checkout session</p>
      </div>
    )
  }

  return (
    <div className={cn('hanzo-checkout-form', className)}>
      {/* Progress Steps */}
      <div className="hanzo-checkout-steps">
        <CheckoutSteps currentStep={step} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="hanzo-checkout-error">
          <p>{error.message}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="hanzo-checkout-content">
        {step === 'cart' && showSummary && (
          <OrderSummary session={session} onContinue={nextStep} />
        )}

        {step === 'shipping' && (
          <ShippingForm
            onSubmit={async (address) => {
              await updateShipping(address)
              nextStep()
            }}
            onBack={prevStep}
            isLoading={isLoading}
            collectPhone={collectPhone}
          />
        )}

        {step === 'payment' && (
          <PaymentForm
            session={session}
            onSubmit={confirmPayment}
            onBack={prevStep}
            isProcessing={isProcessing}
            expressCheckout={expressCheckout}
            submitText={submitText}
          />
        )}

        {step === 'confirmation' && (
          <Confirmation session={session} />
        )}
      </div>
    </div>
  )
}

// Sub-components

function CheckoutSteps({ currentStep }: { currentStep: string }) {
  const steps = [
    { id: 'cart', label: 'Cart' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
    { id: 'confirmation', label: 'Confirm' }
  ]

  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="hanzo-steps">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            'hanzo-step',
            index < currentIndex && 'hanzo-step-completed',
            index === currentIndex && 'hanzo-step-active'
          )}
        >
          <span className="hanzo-step-number">{index + 1}</span>
          <span className="hanzo-step-label">{step.label}</span>
        </div>
      ))}
    </div>
  )
}

function OrderSummary({
  session,
  onContinue
}: {
  session: NonNullable<ReturnType<typeof useCheckout>['session']>
  onContinue: () => void
}) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  return (
    <div className="hanzo-order-summary">
      <h3>Order Summary</h3>

      <div className="hanzo-line-items">
        {session.lineItems.map(item => (
          <div key={item.id} className="hanzo-line-item">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="hanzo-item-image" />
            )}
            <div className="hanzo-item-details">
              <p className="hanzo-item-name">{item.name}</p>
              {item.description && (
                <p className="hanzo-item-desc">{item.description}</p>
              )}
              <p className="hanzo-item-qty">Qty: {item.quantity}</p>
            </div>
            <p className="hanzo-item-price">
              {formatCurrency(item.totalPrice, item.currency)}
            </p>
          </div>
        ))}
      </div>

      <div className="hanzo-totals">
        <div className="hanzo-total-row">
          <span>Subtotal</span>
          <span>{formatCurrency(session.subtotal, session.currency)}</span>
        </div>
        {session.shipping > 0 && (
          <div className="hanzo-total-row">
            <span>Shipping</span>
            <span>{formatCurrency(session.shipping, session.currency)}</span>
          </div>
        )}
        {session.tax > 0 && (
          <div className="hanzo-total-row">
            <span>Tax</span>
            <span>{formatCurrency(session.tax, session.currency)}</span>
          </div>
        )}
        <div className="hanzo-total-row hanzo-total-final">
          <span>Total</span>
          <span>{formatCurrency(session.total, session.currency)}</span>
        </div>
      </div>

      <button
        type="button"
        className="hanzo-btn hanzo-btn-primary"
        onClick={onContinue}
      >
        Continue to Shipping
      </button>
    </div>
  )
}

function ShippingForm({
  onSubmit,
  onBack,
  isLoading,
  collectPhone
}: {
  onSubmit: (address: CheckoutAddress) => Promise<void>
  onBack: () => void
  isLoading: boolean
  collectPhone: boolean
}) {
  const [address, setAddress] = useState<CheckoutAddress>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(address)
  }

  return (
    <form className="hanzo-shipping-form" onSubmit={handleSubmit}>
      <h3>Shipping Address</h3>

      <div className="hanzo-form-field">
        <label htmlFor="line1">Address</label>
        <input
          id="line1"
          type="text"
          required
          placeholder="Street address"
          value={address.line1}
          onChange={e => setAddress(a => ({ ...a, line1: e.target.value }))}
        />
      </div>

      <div className="hanzo-form-field">
        <label htmlFor="line2">Apartment, suite, etc. (optional)</label>
        <input
          id="line2"
          type="text"
          placeholder="Apt, suite, unit"
          value={address.line2 ?? ''}
          onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))}
        />
      </div>

      <div className="hanzo-form-row">
        <div className="hanzo-form-field">
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            required
            placeholder="City"
            value={address.city}
            onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
          />
        </div>

        <div className="hanzo-form-field">
          <label htmlFor="state">State</label>
          <input
            id="state"
            type="text"
            placeholder="State"
            value={address.state ?? ''}
            onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
          />
        </div>
      </div>

      <div className="hanzo-form-row">
        <div className="hanzo-form-field">
          <label htmlFor="postalCode">Postal Code</label>
          <input
            id="postalCode"
            type="text"
            required
            placeholder="ZIP / Postal code"
            value={address.postalCode}
            onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))}
          />
        </div>

        <div className="hanzo-form-field">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            required
            value={address.country}
            onChange={e => setAddress(a => ({ ...a, country: e.target.value }))}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
          </select>
        </div>
      </div>

      <div className="hanzo-form-actions">
        <button type="button" className="hanzo-btn hanzo-btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="hanzo-btn hanzo-btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Continue to Payment'}
        </button>
      </div>
    </form>
  )
}

function PaymentForm({
  session,
  onSubmit,
  onBack,
  isProcessing,
  expressCheckout,
  submitText
}: {
  session: NonNullable<ReturnType<typeof useCheckout>['session']>
  onSubmit: ReturnType<typeof useCheckout>['confirmPayment']
  onBack: () => void
  isProcessing: boolean
  expressCheckout: boolean
  submitText: string
}) {
  const [card, setCard] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  })

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      type: 'card',
      card: {
        number: card.number.replace(/\s/g, ''),
        expMonth: parseInt(card.expMonth, 10),
        expYear: parseInt(card.expYear, 10),
        cvc: card.cvc
      }
    })
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  return (
    <div className="hanzo-payment-form">
      <h3>Payment</h3>

      {/* Express Checkout */}
      {expressCheckout && (
        <div className="hanzo-express-checkout">
          <button type="button" className="hanzo-btn hanzo-btn-apple-pay">
            <ApplePayIcon /> Pay
          </button>
          <button type="button" className="hanzo-btn hanzo-btn-google-pay">
            <GooglePayIcon /> Pay
          </button>
          <div className="hanzo-divider">
            <span>or pay with card</span>
          </div>
        </div>
      )}

      {/* Card Form */}
      <form onSubmit={handleSubmit}>
        <div className="hanzo-form-field">
          <label htmlFor="cardNumber">Card Number</label>
          <input
            id="cardNumber"
            type="text"
            required
            placeholder="1234 5678 9012 3456"
            value={card.number}
            onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
            maxLength={19}
            autoComplete="cc-number"
          />
        </div>

        <div className="hanzo-form-row">
          <div className="hanzo-form-field">
            <label htmlFor="expMonth">Expiry Month</label>
            <input
              id="expMonth"
              type="text"
              required
              placeholder="MM"
              value={card.expMonth}
              onChange={e => setCard(c => ({ ...c, expMonth: e.target.value.slice(0, 2) }))}
              maxLength={2}
              autoComplete="cc-exp-month"
            />
          </div>

          <div className="hanzo-form-field">
            <label htmlFor="expYear">Expiry Year</label>
            <input
              id="expYear"
              type="text"
              required
              placeholder="YY"
              value={card.expYear}
              onChange={e => setCard(c => ({ ...c, expYear: e.target.value.slice(0, 2) }))}
              maxLength={2}
              autoComplete="cc-exp-year"
            />
          </div>

          <div className="hanzo-form-field">
            <label htmlFor="cvc">CVC</label>
            <input
              id="cvc"
              type="text"
              required
              placeholder="123"
              value={card.cvc}
              onChange={e => setCard(c => ({ ...c, cvc: e.target.value.slice(0, 4) }))}
              maxLength={4}
              autoComplete="cc-csc"
            />
          </div>
        </div>

        <div className="hanzo-payment-total">
          <span>Total</span>
          <span>{formatCurrency(session.total, session.currency)}</span>
        </div>

        <div className="hanzo-form-actions">
          <button type="button" className="hanzo-btn hanzo-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="hanzo-btn hanzo-btn-primary" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : submitText}
          </button>
        </div>
      </form>

      <p className="hanzo-secure-badge">
        <LockIcon /> Secured by Hanzo
      </p>
    </div>
  )
}

function Confirmation({
  session
}: {
  session: NonNullable<ReturnType<typeof useCheckout>['session']>
}) {
  return (
    <div className="hanzo-confirmation">
      <div className="hanzo-success-icon">
        <CheckIcon />
      </div>
      <h3>Payment Successful!</h3>
      <p>Thank you for your order.</p>
      <p className="hanzo-order-id">Order ID: {session.id}</p>
      {session.customer?.email && (
        <p>A confirmation email has been sent to {session.customer.email}</p>
      )}
    </div>
  )
}

// Icons
function ApplePayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M17.72 8.2c-.1.08-.97.56-1.44 1.06a3.26 3.26 0 00-.76 2.09c0 2.43 2.13 3.28 2.2 3.32-.01.05-.34 1.18-1.13 2.33-.68.98-1.39 1.96-2.5 1.96-1.1 0-1.45-.64-2.71-.64-1.24 0-1.68.66-2.7.66-1.03 0-1.71-.91-2.5-2.02-.92-1.28-1.71-3.27-1.71-5.14 0-3.02 1.96-4.62 3.9-4.62 1.03 0 1.88.67 2.53.67.63 0 1.6-.72 2.8-.72.45 0 2.07.04 3.14 1.56l-.12.09zM14.54 5.1c.5-.6.86-1.43.86-2.26 0-.11-.01-.24-.03-.33-.82.03-1.8.54-2.39 1.22-.47.53-.9 1.37-.9 2.2 0 .13.02.26.04.3.06.01.16.02.26.02.74 0 1.67-.49 2.16-1.15z"/>
    </svg>
  )
}

function GooglePayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 11.9l-1.79 1.79c-.34.34-.34.89 0 1.23.34.34.89.34 1.23 0l1.79-1.79 1.79 1.79c.34.34.89.34 1.23 0 .34-.34.34-.89 0-1.23L14.46 11.9l1.79-1.79c.34-.34.34-.89 0-1.23-.34-.34-.89-.34-1.23 0L13.23 10.67l-1.79-1.79c-.34-.34-.89-.34-1.23 0-.34.34-.34.89 0 1.23L12 11.9z"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  )
}

export default CheckoutForm
