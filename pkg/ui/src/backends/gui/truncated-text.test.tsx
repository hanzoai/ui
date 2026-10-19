// @vitest-environment jsdom

/**
 * TruncatedText shows its hint only when the text was cut: the measurement is
 * scroll size against client size, taken when the pointer enters or focus
 * arrives. jsdom lays nothing out, so the two sizes are stated per test.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { TruncatedText, TruncatedTextProvider, overflows } from './truncated-text'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>)
const tag = (markup: string) => markup.match(/<[a-z0-9]+[^>]*data-slot="truncated-text"[^>]*>/)?.[0] ?? ''

describe('overflows', () => {
  it('compares scroll size with client size, either axis', () => {
    expect(overflows({ scrollWidth: 200, clientWidth: 100, scrollHeight: 10, clientHeight: 10 })).toBe(true)
    expect(overflows({ scrollWidth: 100, clientWidth: 100, scrollHeight: 40, clientHeight: 20 })).toBe(true)
    expect(overflows({ scrollWidth: 100, clientWidth: 100, scrollHeight: 20, clientHeight: 20 })).toBe(false)
    expect(overflows(null)).toBe(false)
  })
})

describe('TruncatedText markup', () => {
  it('one line by default, shrinkable inside a row', () => {
    const el = tag(html(<TruncatedText text="A long label" />))
    expect(el).toMatch(/_maxWidth-10037|_maxW-10037|maxWidth/)
    expect(el).toMatch(/_minW-0px/)
    expect(html(<TruncatedText text="A long label" />)).toContain('A long label')
  })

  it('a clamp wraps anywhere instead', () => {
    expect(tag(html(<TruncatedText text="x" lineClamp={3} />))).toMatch(/overflow-wrap:anywhere/)
  })

  it('a disabled provider renders the text alone', () => {
    const plain = html(
      <TruncatedTextProvider mode="disabled">
        <TruncatedText text="cell" />
      </TruncatedTextProvider>,
    )
    expect(plain).toContain('cell')
  })

  it('focusable on request', () => {
    expect(tag(html(<TruncatedText text="x" isFocusable />))).toMatch(/tabindex="0"/)
  })
})

describe('TruncatedText behaviour', () => {
  let host: HTMLDivElement
  let root: Root
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.appendChild(host)
    root = createRoot(host)
  })
  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  const size = (el: HTMLElement, scroll: number, client: number) => {
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scroll })
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: client })
  }

  it('a cut text turns its cursor to a pointer on hover; a whole one does not', () => {
    act(() =>
      root.render(
        <GuiProvider config={config} defaultTheme="dark">
          <TruncatedText text="cut" />
          <TruncatedText text="whole" />
        </GuiProvider>,
      ),
    )
    const [cut, whole] = [...host.querySelectorAll('[data-slot="truncated-text"]')] as HTMLElement[]
    size(cut, 300, 100)
    size(whole, 100, 100)
    const Pointer = (globalThis.PointerEvent ?? MouseEvent) as typeof MouseEvent
    act(() => {
      cut.dispatchEvent(new Pointer('pointerover', { bubbles: true }))
      whole.dispatchEvent(new Pointer('pointerover', { bubbles: true, relatedTarget: cut }))
    })
    expect(cut.className).toMatch(/_cur-pointer/)
    expect(whole.className).not.toMatch(/_cur-pointer/)
  })

})
