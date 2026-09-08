// @vitest-environment jsdom

/**
 * OrderEntry — asserted on a live DOM: side and order-type selection, the
 * limit-price field's appearance, and the composed order that reaches
 * `onPlaceOrder`.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { OrderEntry } from './order-entry'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    sides: () => [...host.querySelectorAll<HTMLElement>('[data-slot="order-entry-side-option"]')],
    types: () => [...host.querySelectorAll<HTMLElement>('[data-slot="order-entry-type-option"]')],
    shares: () => host.querySelector<HTMLInputElement>('#order-entry-shares-input'),
    limitPrice: () => host.querySelector<HTMLInputElement>('#order-entry-limit-price-input'),
    submit: () => host.querySelector<HTMLElement>('[data-slot="order-entry-submit"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const type = (el: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('OrderEntry', () => {
  it('renders every documented slot and shows the buying power', () => {
    const view = mount(<OrderEntry accountBalance={12345} />)

    expect(view.host.querySelector('[data-slot="order-entry"]')).not.toBeNull()
    expect(view.host.querySelector('[data-slot="order-entry-balance"]')?.textContent).toContain(
      '12,345',
    )
    expect(view.sides()).toHaveLength(2)
    expect(view.types()).toHaveLength(2)
    view.cleanup()
  })

  it('defaults to buy/market and shows no limit price field', () => {
    const view = mount(<OrderEntry />)

    expect(view.sides()[0].getAttribute('data-state')).toBe('on')
    expect(view.sides()[1].getAttribute('data-state')).toBe('off')
    expect(view.types()[0].getAttribute('data-state')).toBe('on')
    expect(view.limitPrice()).toBeNull()
    view.cleanup()
  })

  it('switches side on click', () => {
    const view = mount(<OrderEntry />)

    act(() => view.sides()[1].click())

    expect(view.sides()[1].getAttribute('data-state')).toBe('on')
    expect(view.sides()[0].getAttribute('data-state')).toBe('off')
    view.cleanup()
  })

  it('reveals the limit price field only for a limit order', () => {
    const view = mount(<OrderEntry />)

    expect(view.limitPrice()).toBeNull()
    act(() => view.types()[1].click())
    expect(view.limitPrice()).not.toBeNull()
    act(() => view.types()[0].click())
    expect(view.limitPrice()).toBeNull()
    view.cleanup()
  })

  it('disables submit until shares (and, for a limit order, a limit price) are entered', () => {
    const view = mount(<OrderEntry />)

    expect(view.submit()?.getAttribute('aria-disabled')).not.toBeNull()
    type(view.shares()!, '10')
    expect(view.submit()?.getAttribute('aria-disabled')).toBeNull()

    act(() => view.types()[1].click())
    expect(view.submit()?.getAttribute('aria-disabled')).not.toBeNull()
    type(view.limitPrice()!, '150.5')
    expect(view.submit()?.getAttribute('aria-disabled')).toBeNull()
    view.cleanup()
  })

  it('submits the composed order and clears the form', () => {
    const onPlaceOrder = vi.fn()
    const view = mount(<OrderEntry symbol="NASDAQ:AAPL" onPlaceOrder={onPlaceOrder} />)

    act(() => view.sides()[1].click())
    act(() => view.types()[1].click())
    type(view.shares()!, '10')
    type(view.limitPrice()!, '150.5')
    act(() => view.submit()!.click())

    expect(onPlaceOrder).toHaveBeenCalledWith({
      symbol: 'NASDAQ:AAPL',
      side: 'sell',
      orderType: 'limit',
      shares: 10,
      limitPrice: 150.5,
    })
    expect(view.shares()!.value).toBe('')
    expect(view.limitPrice()!.value).toBe('')
    view.cleanup()
  })

  it('never fires and shows every control disabled when `disabled` is set', () => {
    const onPlaceOrder = vi.fn()
    const view = mount(<OrderEntry disabled onPlaceOrder={onPlaceOrder} />)

    expect(view.sides()[0].getAttribute('aria-disabled')).not.toBeNull()
    expect(view.submit()?.getAttribute('aria-disabled')).not.toBeNull()
    act(() => view.sides()[1].click())
    expect(view.sides()[0].getAttribute('data-state')).toBe('on')
    view.cleanup()
  })
})
