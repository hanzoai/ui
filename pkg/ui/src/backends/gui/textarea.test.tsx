// @vitest-environment jsdom

/**
 * The field grows with its CONTENT, and taking a ref to measure it must not
 * cost the caller theirs.
 *
 * The growth itself is a layout fact and jsdom performs no layout —
 * `scrollHeight` is 0 there, so the measurement no-ops and there is nothing
 * here that could observe it. It is measured in Chromium instead, against the
 * packed tarball: at 420px wide, 700 characters with no newline read
 * `clientHeight 44` around `scrollHeight 160` before this and `160/160` after,
 * shrink back to 44, and sixty lines clamp at the 200px ceiling while
 * `scrollHeight` runs to 1200.
 *
 * What jsdom CAN hold is the thing the measurement put at risk: the component
 * now needs the host node for itself, and a caller's ref has to survive that.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Textarea } from './textarea'

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
    // The component holds its own ref to measure the content. A callback ref
    // that forgot to pass the node on would take every caller's focus(),
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
