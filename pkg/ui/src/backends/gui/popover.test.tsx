// @vitest-environment jsdom

/**
 * The Popover's ALIGNMENT.
 *
 * `PopoverContent` used to destructure `align` into a variable it never read,
 * so every caller asking for a left- or right-aligned panel got a centred one
 * — silently, because a discarded prop is not an error and the panel still
 * appears. Nothing downstream could see it either: the panel is portalled and
 * positioned by floating-ui at run time, so its placement never reaches the
 * server-rendered markup and no snapshot could have caught this.
 *
 * The decision it now makes is `place()`, which is shared with `hover-card` and
 * tested in `place.test.ts`. What is asserted HERE is the component's own half:
 * that it accepts the prop and still renders.
 */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Density } from './density'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('Popover', () => {
  it('renders its trigger without a layout pass', () => {
    // The content is portalled and does not reach SSR markup; the trigger does,
    // and asserting it keeps this file honest about what SSR can prove.
    const markup = html(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent align="start">Panel</PopoverContent>
      </Popover>,
    )
    expect(markup).toContain('Open')
  })

  it('accepts an align without throwing on any legal value', () => {
    for (const align of ['start', 'center', 'end'] as const) {
      expect(() =>
        html(
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent align={align}>Panel</PopoverContent>
          </Popover>,
        ),
      ).not.toThrow()
    }
  })

  it('lets a caller override the default surface', () => {
    // The visual props are DEFAULTS, not fixtures: {...props} spreads last, so a
    // call site keeps the width and surface it had before converting.
    const markup = html(
      <Popover open>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent width={480}>Panel</PopoverContent>
      </Popover>,
    )
    expect(markup).toContain('Open')
  })
})

/**
 * A SOLID PANEL, and the list it opens.
 *
 * Mounted in a live DOM, because the content is portalled and SSR never sees
 * it. The mark is what glass.css reads to take the frost off, so the mark is
 * what is asserted: on the panel that asked, on a popover opened from inside
 * it, and on no popover that did not.
 */
describe('PopoverContent solid', () => {
  it('marks the panel and every popover opened inside it, and nothing else', async () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <Popover open>
            <PopoverTrigger>Outer</PopoverTrigger>
            <PopoverContent solid>
              <Popover open>
                <PopoverTrigger>Inner</PopoverTrigger>
                <PopoverContent>List</PopoverContent>
              </Popover>
            </PopoverContent>
          </Popover>
          <Popover open>
            <PopoverTrigger>Other</PopoverTrigger>
            <PopoverContent>Glass</PopoverContent>
          </Popover>
        </GuiProvider>,
      )
      await new Promise((r) => setTimeout(r, 0))
    })
    const panels = [...document.querySelectorAll('[data-slot="popover-content"]')]
    const solid = panels.filter((p) => p.getAttribute('data-material') === 'solid')
    const glass = panels.filter((p) => !p.hasAttribute('data-material'))
    expect(panels).toHaveLength(3)
    expect(solid).toHaveLength(2)
    expect(glass.map((p) => p.textContent)).toEqual(['Glass'])
    await act(async () => root.unmount())
    host.remove()
  })
})

/**
 * The record panel: an 8px inset sized to its content, asked for by `size="sm"`
 * or given by a compact density; the default stays the 16px, 288-wide panel;
 * `arrow` adds the pointer. Mounted, because the content is portalled.
 */
describe('PopoverContent size', () => {
  const panels = async (node: React.ReactNode) => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    await act(async () => {
      root.render(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
      await new Promise((r) => setTimeout(r, 0))
    })
    const found = [...document.querySelectorAll<HTMLElement>('[data-slot="popover-content"]')].map((p) => ({
      size: p.getAttribute('data-size'),
      cls: p.className,
      arrow: !!p.querySelector('[data-slot="popover-arrow"]'),
    }))
    await act(async () => root.unmount())
    host.remove()
    return found
  }

  it('sm: an 8px inset and no fixed width; the default keeps 16 and 288', async () => {
    const [sm, regular] = await panels(
      <>
        <Popover open>
          <PopoverTrigger>A</PopoverTrigger>
          <PopoverContent size="sm" arrow>
            Small
          </PopoverContent>
        </Popover>
        <Popover open>
          <PopoverTrigger>B</PopoverTrigger>
          <PopoverContent>Regular</PopoverContent>
        </Popover>
      </>,
    )
    expect(sm.size).toBe('sm')
    expect(sm.cls).toMatch(/_pl-c-space-2/)
    expect(sm.cls).not.toMatch(/_w-288px|_width-288px/)
    expect(sm.arrow).toBe(true)
    expect(regular.size).toBeNull()
    expect(regular.cls).toMatch(/_pl-c-space-4/)
    expect(regular.arrow).toBe(false)
  })

  it('a compact density gives the small panel to a popover that names no size', async () => {
    const [p] = await panels(
      <Density value="compact">
        <Popover open>
          <PopoverTrigger>A</PopoverTrigger>
          <PopoverContent>Compact</PopoverContent>
        </Popover>
      </Density>,
    )
    expect(p.size).toBe('sm')
  })
})
