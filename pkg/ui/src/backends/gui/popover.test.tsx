// @vitest-environment jsdom

/**
 * The Popover's ALIGNMENT.
 *
 * `PopoverContent` used to destructure `align` into a variable it never read,
 * so every caller asking for a left- or right-aligned panel got a centred one
 * — silently, because a discarded prop is not an error and the panel still
 * appears. Nothing downstream could see it either: the panel is portalled and
 * positioned by floating-ui at run time, so its offset never reaches the
 * server-rendered markup and no snapshot could have caught this.
 *
 * What IS assertable is the decision, so the decision is a pure function and
 * this file tests it directly. `place` is the whole of it: gui speaks
 * floating-ui's single placement string, the compound API splits that fact
 * into a side and an align, and rejoining them is the only logic involved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Popover, PopoverContent, PopoverTrigger, place } from './popover'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

describe('place', () => {
  it('names the side alone when the alignment is centre', () => {
    expect(place('bottom')).toBe('bottom')
    expect(place('bottom', 'center')).toBe('bottom')
    expect(place('top', 'center')).toBe('top')
  })

  it('suffixes the side with a non-centre alignment', () => {
    expect(place('bottom', 'start')).toBe('bottom-start')
    expect(place('bottom', 'end')).toBe('bottom-end')
    expect(place('right', 'start')).toBe('right-start')
  })

  it('RE-aligns a side that already carries a suffix rather than appending', () => {
    // The root may be given a full placement and Content may still declare an
    // align; the later word wins, and the result stays a legal placement.
    expect(place('bottom-end', 'start')).toBe('bottom-start')
    expect(place('bottom-start', 'center')).toBe('bottom')
  })

  it('is idempotent', () => {
    expect(place(place('bottom', 'start'), 'start')).toBe('bottom-start')
  })
})

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
})
