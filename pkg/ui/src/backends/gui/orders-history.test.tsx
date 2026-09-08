// @vitest-environment jsdom

/**
 * OrdersHistory behaviour, asserted on compiled markup and a live DOM — never
 * on the text, because @hanzo/gui drops props it does not recognise with no
 * throw, so "the label rendered" proves only that a string reached a Text host.
 *
 * Imports `./orders-history` directly rather than the backend barrel, so this
 * test fails only when this component's own dependencies move.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { OrdersHistory, type Order } from './orders-history'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    rows: () => [...host.querySelectorAll<HTMLElement>('[data-slot="orders-history-row"]')],
    filters: () => [...host.querySelectorAll<HTMLElement>('[data-slot="orders-history-filter"]')],
    cancelButtons: () => [...host.querySelectorAll<HTMLElement>('[data-slot="orders-history-cancel"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const orders: Order[] = [
  {
    id: '1',
    symbol: 'NASDAQ:AAPL',
    type: 'buy',
    shares: 100,
    price: 175.5,
    status: 'open',
    timestamp: Date.parse('2024-01-01T00:00:00Z'),
    orderType: 'limit',
  },
  {
    id: '2',
    symbol: 'NASDAQ:MSFT',
    type: 'sell',
    shares: 10,
    price: 0,
    status: 'filled',
    timestamp: Date.parse('2024-01-02T00:00:00Z'),
  },
  {
    id: '3',
    symbol: 'NASDAQ:GOOG',
    type: 'buy',
    shares: 5,
    price: 140,
    status: 'cancelled',
    timestamp: Date.parse('2024-01-03T00:00:00Z'),
  },
]

describe('OrdersHistory', () => {
  it('renders one row per order, each naming its ticker and status', () => {
    const markup = html(<OrdersHistory orders={orders} />)

    expect(markup).toContain('data-status="open"')
    expect(markup).toContain('data-status="filled"')
    expect(markup).toContain('data-status="cancelled"')
    expect(markup).toContain('AAPL')
    expect(markup).toContain('MSFT')
  })

  it('says No orders yet when the list is empty', () => {
    const markup = html(<OrdersHistory orders={[]} />)

    expect(markup).toContain('data-slot="orders-history-empty"')
    expect(markup).toContain('No orders yet')
  })

  it('shows Market instead of a price for a zero-price order', () => {
    const markup = html(<OrdersHistory orders={[orders[1]]} />)

    expect(markup).toContain('Market')
    expect(markup).not.toContain('$0.00')
  })

  it('shows the filter row by default and can be told to hide it', () => {
    expect(html(<OrdersHistory orders={orders} />)).toContain('data-slot="orders-history-filters"')
    expect(html(<OrdersHistory orders={orders} showFilters={false} />)).not.toContain(
      'orders-history-filters',
    )
  })

  it('narrows the list to the selected status filter', () => {
    const view = mount(<OrdersHistory orders={orders} />)
    expect(view.rows()).toHaveLength(3)

    const filled = view.filters().find((f) => f.textContent === 'Filled')!
    act(() => filled.click())
    expect(view.rows()).toHaveLength(1)
    expect(view.rows()[0].dataset.status).toBe('filled')

    const all = view.filters().find((f) => f.textContent === 'All')!
    act(() => all.click())
    expect(view.rows()).toHaveLength(3)

    view.cleanup()
  })

  it('offers Cancel Order only on an open order, and only when a handler is given', () => {
    const withHandler = html(<OrdersHistory orders={orders} onCancelOrder={() => {}} />)
    expect(withHandler.match(/orders-history-cancel/g)).toHaveLength(1)

    const withoutHandler = html(<OrdersHistory orders={orders} />)
    expect(withoutHandler).not.toContain('orders-history-cancel')
  })

  it('cancels the clicked order without also firing the row click', () => {
    const onCancelOrder = vi.fn()
    const onOrderClick = vi.fn()
    const view = mount(
      <OrdersHistory orders={orders} onCancelOrder={onCancelOrder} onOrderClick={onOrderClick} />,
    )

    act(() => view.cancelButtons()[0].click())

    expect(onCancelOrder).toHaveBeenCalledWith('1')
    expect(onOrderClick).not.toHaveBeenCalled()

    view.cleanup()
  })

  it('reports the clicked order to onOrderClick', () => {
    const onOrderClick = vi.fn()
    const view = mount(<OrdersHistory orders={orders} onOrderClick={onOrderClick} />)

    act(() => view.rows()[1].click())

    expect(onOrderClick).toHaveBeenCalledWith(orders[1])
    view.cleanup()
  })
})
