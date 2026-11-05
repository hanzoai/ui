import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe as group, expect, it, vi } from 'vitest'
import type { Analytics } from '@hanzo/event'
import { ObserveProvider } from './react'

// The binding is what an app mounts, and it hands the engine every prop it was
// given, an omitted one included: `{ viewSelector: undefined }`. The engine's
// defaults used to sit UNDER a spread of that object, so the undefined replaced
// '[data-hz-view]' and no $view was ever reported through a provider.

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

class FakeIO {
  static all: FakeIO[] = []
  watched = new Set<Element>()
  constructor(private cb: IntersectionObserverCallback) {
    FakeIO.all.push(this)
  }
  observe(el: Element) {
    this.watched.add(el)
  }
  unobserve(el: Element) {
    this.watched.delete(el)
  }
  disconnect() {
    this.watched.clear()
  }
  show(el: Element) {
    const entry = { target: el, isIntersecting: true, intersectionRatio: 1, intersectionRect: { height: 100 }, rootBounds: { height: 900 } }
    this.cb([entry as unknown as IntersectionObserverEntry], this as never)
  }
}

let root: Root
let host: HTMLElement
let captured: Array<{ name: string; props: Record<string, unknown> }>

const client = {
  capture: (name: string, props: Record<string, unknown>) => captured.push({ name, props }),
  pageview: () => {},
} as unknown as Analytics

beforeEach(() => {
  FakeIO.all = []
  vi.stubGlobal('IntersectionObserver', FakeIO)
  captured = []
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

group('ObserveProvider', () => {
  it('reports a $view with no viewSelector given, by the engine’s default', async () => {
    await act(async () => {
      root.render(
        createElement(
          ObserveProvider,
          { client, nav: false },
          createElement('section', { id: 'plans', 'data-hz-view': 'plans' }, 'Plans'),
        ),
      )
    })
    const io = FakeIO.all[0]
    const section = host.querySelector('[data-hz-view]')!
    expect(io.watched.has(section)).toBe(true)
    io.show(section)
    expect(captured.map((c) => c.name)).toEqual(['$view'])
    expect(captured[0].props).toMatchObject({ $section: 'plans', $id: 'plans', ratio: 1 })
  })

  it('emits a click through the client it was handed', async () => {
    await act(async () => {
      root.render(createElement(ObserveProvider, { client, nav: false }, createElement('button', { id: 'go' }, 'Go')))
    })
    host.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1, clientX: 4, clientY: 4 }))
    expect(captured.map((c) => c.name)).toEqual(['$click'])
    expect(captured[0].props).toMatchObject({ $id: 'go', $x: 4, $y: 4 })
  })
})
