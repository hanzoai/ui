// @vitest-environment jsdom

/**
 * InteractiveGridPattern draws one `<rect>` per cell and swaps a single
 * cell's fill on pointer enter/leave. Asserted on a live DOM, because static
 * markup can't fire mouse events.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { InteractiveGridPattern } from './interactive-grid-pattern'

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
    squares: () => [...host.querySelectorAll<SVGRectElement>('[data-slot="interactive-grid-pattern-square"]')],
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('InteractiveGridPattern', () => {
  it('renders one square per cell in the grid', () => {
    const markup = renderToStaticMarkup(wrap(<InteractiveGridPattern squares={[4, 3]} width={10} height={10} />))
    expect((markup.match(/data-slot="interactive-grid-pattern-square"/g) ?? []).length).toBe(12)
    expect(markup).toContain('data-slot="interactive-grid-pattern"')
  })

  it('sizes the svg from cell size times the square count', () => {
    const markup = renderToStaticMarkup(wrap(<InteractiveGridPattern squares={[5, 2]} width={20} height={30} />))
    const svg = markup.match(/<svg[^>]*>/)?.[0] ?? ''
    expect(svg).toContain('width="100"')
    expect(svg).toContain('height="60"')
  })

  it('lights up the hovered square and only that one', () => {
    const { squares, cleanup } = mount(
      <InteractiveGridPattern squares={[3, 3]} width={10} height={10} hoverColor="rgb(1, 2, 3)" idleColor="transparent" />,
    )
    const cells = squares()
    expect(cells).toHaveLength(9)
    expect(cells.every((c) => c.getAttribute('fill') === 'transparent')).toBe(true)

    act(() => {
      cells[4].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })

    const after = squares()
    expect(after[4].getAttribute('data-hovered')).toBe('true')
    expect(after[4].getAttribute('fill')).toBe('rgb(1, 2, 3)')
    expect(after.filter((c) => c.getAttribute('data-hovered') === 'true')).toHaveLength(1)

    cleanup()
  })

  it('clears the hover on mouse leave', () => {
    const { squares, cleanup } = mount(<InteractiveGridPattern squares={[2, 2]} width={10} height={10} hoverColor="red" />)
    const cells = squares()

    act(() => {
      cells[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    expect(squares()[0].getAttribute('fill')).toBe('red')

    act(() => {
      cells[0].dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    })
    expect(squares()[0].getAttribute('fill')).toBe('transparent')

    cleanup()
  })
})
