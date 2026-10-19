// @vitest-environment jsdom

/**
 * Taking a ref to measure the field must not cost the caller theirs.
 *
 * The growth itself is a layout fact and jsdom performs no layout, so it is
 * measured in Chromium against the packed tarball instead.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import { renderToStaticMarkup } from 'react-dom/server'

import config from '../../gui-config'
import { Textarea } from './textarea'
import { Density } from './density'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

const mount = (ui: React.ReactNode) => {
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('Textarea', () => {
  it('still hands the caller the node it asked for', () => {
    // A callback ref that dropped the node would take every caller's focus(),
    // select() and scrollIntoView() with it, silently and at run time.
    const ref = createRef<HTMLTextAreaElement>()
    mount(<Textarea ref={ref} value="" onChangeText={() => {}} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('reaches a callback ref too', () => {
    let got: HTMLTextAreaElement | null = null
    mount(<Textarea ref={(el) => { got = el }} value="" onChangeText={() => {}} />)
    expect(got).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('keeps a caller style alongside the measured height', () => {
    mount(<Textarea style={{ opacity: 0.5 }} value="" onChangeText={() => {}} />)
    const el = host.querySelector('textarea')
    expect(el?.style.opacity).toBe('0.5')
  })

  it('takes a floor in rows and a ceiling in pixels', () => {
    mount(<Textarea rows={1} minH={44} maxH={200} value="" onChangeText={() => {}} />)
    const cls = host.querySelector('textarea')?.className ?? ''
    expect(cls).toContain('_minH-44px')
    expect(cls).toContain('_maxH-200px')
  })
})

describe('Textarea sizes', () => {
  const html = (node: React.ReactNode) =>
    renderToStaticMarkup(
      <GuiProvider config={config} defaultTheme="dark">
        {node}
      </GuiProvider>,
    )
  const tag = (markup: string) => markup.match(/<textarea[^>]*>/)?.[0] ?? ''

  it('the regular box is untouched: 12px gutter, 7px riser, 14px rung, 64px floor', () => {
    const el = tag(html(<Textarea placeholder="x" />))
    expect(el).toMatch(/_pl-12px/)
    expect(el).toMatch(/_pt-7px/)
    expect(el).toMatch(/_fs-f-size-3/)
    expect(el).toMatch(/_minH-64px/)
    expect(el).not.toMatch(/_lh-16px/)
  })

  it.each([
    ['sm', 7, 64],
    ['xs', 3, 56],
  ] as const)('%s: 8px gutter, its riser, 13px on a 16px line, three lines high', (size, riser, floor) => {
    const el = tag(html(<Textarea size={size} placeholder="x" />))
    expect(el).toMatch(/_pl-8px/)
    expect(el).toMatch(new RegExp(`_pt-${riser}px`))
    expect(el).toMatch(/_fs-f-size-2/)
    expect(el).toMatch(/_lh-16px/)
    expect(el).toMatch(new RegExp(`_minH-${floor}px`))
  })

  it('maxRows caps the box at its lines, risers and edges', () => {
    // 4 lines of 16 + 2 x 7 + 2 = 80.
    expect(tag(html(<Textarea size="sm" maxRows={4} />))).toMatch(/_maxH-80px/)
    // 4 lines of 20 + 2 x 7 + 2 = 96 on the regular box.
    expect(tag(html(<Textarea maxRows={4} />))).toMatch(/_maxH-96px/)
  })

  it('compact: the sm box on the panel ground', () => {
    const el = tag(
      html(
        <Density value="compact">
          <Textarea placeholder="x" />
        </Density>,
      ),
    )
    expect(el).toMatch(/_pl-8px/)
    expect(el).toMatch(/_bg-panel/)
  })

  it('an invalid field draws the error edge, deeper under focus', () => {
    const el = tag(html(<Textarea aria-invalid placeholder="x" />))
    expect(el).toMatch(/_btc-red7/)
    expect(el).toMatch(/_btc-0focus-red8/)
  })
})
