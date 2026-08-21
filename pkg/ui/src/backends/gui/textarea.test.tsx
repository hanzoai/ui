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
