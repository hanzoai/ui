// @vitest-environment jsdom

/**
 * PositionsList behaviour, asserted on compiled markup and a live DOM — never
 * on the text, because @hanzo/gui drops props it does not recognise with no
 * throw, so "the label rendered" proves only that a string reached a Text host.
 *
 * Imports `./positions-list` directly rather than the backend barrel, so this
 * test fails only when this component's own dependencies move.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { PositionsList, type Position } from './positions-list'

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
    rows: () => [...host.querySelectorAll<HTMLElement>('[data-slot="positions-list-row"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const positions: Position[] = [
  { symbol: 'NASDAQ:AAPL', shares: 100, avgPrice: 150, currentPrice: 175.5 },
  { symbol: 'NASDAQ:MSFT', shares: 10, avgPrice: 420, currentPrice: 415.2 },
]

describe('PositionsList', () => {
  it('renders one row per position, each naming its ticker and P&L trend', () => {
    const markup = html(<PositionsList positions={positions} />)

    expect(markup).toContain('data-trend="up"')
    expect(markup).toContain('data-trend="down"')
    expect(markup).toContain('AAPL')
    expect(markup).toContain('MSFT')
  })

  it('says No open positions when the list is empty', () => {
    const markup = html(<PositionsList positions={[]} />)

    expect(markup).toContain('data-slot="positions-list-empty"')
    expect(markup).toContain('No open positions')
  })

  it('computes P&L as (current - avg) * shares, signed', () => {
    const markup = html(<PositionsList positions={[positions[0]]} />)

    // (175.50 - 150) * 100 = 2550.00, up 17.00%
    expect(markup).toContain('+$2550.00')
    expect(markup).toContain('+17.00%')
  })

  it('shows a loss without a plus sign', () => {
    const markup = html(<PositionsList positions={[positions[1]]} />)

    // (415.20 - 420) * 10 = -48.00, down -1.14%
    expect(markup).toContain('$-48.00')
    expect(markup).toContain('-1.14%')
    expect(markup).not.toContain('+$-48.00')
  })

  it('is not clickable when no handler is given', () => {
    const markup = html(<PositionsList positions={positions} />)
    expect(markup).not.toContain('cursor:pointer')
  })

  it('reports the clicked position to onPositionClick', () => {
    const onPositionClick = vi.fn()
    const view = mount(<PositionsList positions={positions} onPositionClick={onPositionClick} />)

    act(() => view.rows()[1].click())

    expect(onPositionClick).toHaveBeenCalledWith(positions[1])
    view.cleanup()
  })
})
