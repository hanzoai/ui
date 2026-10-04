// @vitest-environment jsdom

/**
 * A field's size and ground, on all three fields and the Picker.
 *
 * The box is read off the classes gui compiles from the props, because jsdom
 * performs no layout; the rendered pixels are measured in Chromium by the app.
 */
import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Input } from './input'
import { Picker } from './select'
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

const cls = (sel: string) => host.querySelector(sel)?.className ?? ''

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

describe('Input size', () => {
  it('is 36 with a 12 gutter by default, on a bare edge', () => {
    mount(<Input aria-label="a" />)
    const c = cls('input')
    expect(c).toContain('_height-36px')
    expect(c).toContain('_pl-12px')
    expect(c).toContain('_bg-transparent')
  })

  it('is 46 with a 14 gutter at lg, on the raised ground with fill', () => {
    mount(<Input aria-label="a" size="lg" fill />)
    const c = cls('input')
    expect(c).toContain('_height-46px')
    expect(c).toContain('_pl-14px')
    expect(c).toContain('_pr-14px')
    expect(c).not.toContain('_bg-transparent')
    expect(c).toMatch(/_bg-raised/)
  })

  it('never hands `size` to gui, whose size variant would restate the box', () => {
    mount(<Input aria-label="a" size="lg" />)
    expect(host.querySelector('input')?.getAttribute('size')).toBeNull()
    // 46 on a pointer and, raised to the touch floor, still 46 under a thumb.
    expect(cls('input')).not.toMatch(/_height-(?!46px|_touchable_46px)/)
  })
})

describe('Textarea size', () => {
  it('stacks its first line on the riser of its size', () => {
    mount(<Textarea size="lg" fill value="" onChangeText={() => {}} />)
    const c = cls('textarea')
    expect(c).toContain('_pt-12px')
    expect(c).toContain('_pl-14px')
    expect(c).toMatch(/_bg-raised/)
  })
})

describe('Picker', () => {
  it('is a native select holding its options, with the ref the caller asked for', () => {
    const ref = createRef<HTMLSelectElement>()
    mount(
      <Picker ref={ref} id="p" value="b" onChange={() => {}}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Picker>,
    )
    const el = host.querySelector('select')
    expect(el?.id).toBe('p')
    expect(el?.options.length).toBe(2)
    expect(el?.value).toBe('b')
    expect(ref.current).toBe(el)
  })

  it('wears the Input box per size, less the select\'s own 4px inset', () => {
    mount(
      <Picker aria-label="p" size="lg" fill>
        <option value="">Select</option>
      </Picker>,
    )
    const c = cls('select')
    expect(c).toContain('_minH-46px')
    expect(c).not.toMatch(/_height-/)
    expect(c).toContain('_pl-10px')
    expect(c).toContain('_pt-12px')
    expect(c).toMatch(/_bg-raised/)
  })

  it('takes the Input\'s edge under the pointer and under focus', () => {
    mount(
      <Picker aria-label="p">
        <option value="">Select</option>
      </Picker>,
    )
    const c = cls('select')
    expect(c).toMatch(/_btc-0hover-borderColo/)
    expect(c).toMatch(/_btc-0focus-borderColo/)
  })
})
