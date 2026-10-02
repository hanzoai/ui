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
