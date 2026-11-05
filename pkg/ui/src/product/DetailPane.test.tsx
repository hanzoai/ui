// @vitest-environment jsdom

/**
 * The side panel against a live DOM: the docked column beside the page (no
 * scrim, a resizer on its leading edge, the width kept), the record frame's bar
 * and footer, the page stack (push, back, a back button only while there is a
 * page under), Escape and ⌘↵ from inside it, the overlay kept as it was for a
 * regular surface and given the record frame under a compact one, and axe on
 * the open pane.
 *
 * The page is wide here: `matchMedia` answers like a 1280px desktop, so `lg`
 * holds and the docked mode docks. Below lg a docked pane is the overlay again
 * (DetailPane.narrow.test.tsx: gui reads the media once, so the width has to be
 * set before the config loads).
 */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  const state = { width: 1280 }
  const matches = (q: string) => {
    const min = q.match(/min-width:\s*([\d.]+)px/)
    const max = q.match(/max-width:\s*([\d.]+)px/)
    if (min && state.width < Number(min[1])) return false
    if (max && state.width > Number(max[1])) return false
    if (/pointer:\s*coarse/.test(q)) return false
    return !!(min || max || /hover:\s*hover/.test(q))
  }
  window.matchMedia = ((query: string) => ({
    matches: matches(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  return state
})

import { GuiProvider } from '@hanzo/gui'
import config from '../gui-config'
import { audit } from '../../test/axe'
import { Density } from '../backends/gui/density'
import { DetailPane, PaneBar, PaneBody, PaneFoot, useDetailPane, type DetailPaneApi } from './DetailPane'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers()
  localStorage.clear()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.useRealTimers()
})

const mount = (ui: ReactNode) =>
  act(() => {
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        {ui}
      </GuiProvider>,
    )
  })

function Capture({ onApi }: { onApi: (api: DetailPaneApi) => void }) {
  onApi(useDetailPane())
  return null
}

const pane = () => host.querySelector('[data-slot="detail-pane"]') as HTMLElement
const bar = () => host.querySelector('[data-slot="pane-bar"]') as HTMLElement | null
const press = (label: string) => {
  const el = host.querySelector(`[aria-label="${label}"]`) as HTMLElement
  expect(el, label).toBeTruthy()
  act(() => el.click())
}
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }))
  })

const docked = (onApi: (a: DetailPaneApi) => void) =>
  mount(
    <DetailPane mode="docked">
      <main data-page>page</main>
      <Capture onApi={onApi} />
    </DetailPane>,
  )

describe('a docked pane', () => {
  it('is a column beside the page, with no scrim and no dialog', () => {
    let api!: DetailPaneApi
    docked((a) => (api = a))
    expect(host.querySelector('[data-slot="detail-pane-row"] [data-page]')).toBeTruthy()
    expect(pane().getAttribute('role')).toBe('complementary')
    expect(pane().getAttribute('aria-hidden')).toBe('true')
    act(() => api.open({ title: 'Acme', content: <span>body</span> }))
    expect(pane().getAttribute('aria-hidden')).toBe('false')
    expect(host.querySelector('[role="dialog"]')).toBeNull()
    // The column animates its width to the kept one; the page inside holds it.
    // Both are gui classes (useSpan's props), not a style on the element.
    expect(pane().className).toMatch(/span-400px/)
    expect(pane().getAttribute('style') ?? '').not.toMatch(/width|--span/)
  })

  it('draws the record frame: the bar with the title and close, the body, the footer', () => {
    let api!: DetailPaneApi
    docked((a) => (api = a))
    act(() => api.open({ title: 'Acme', subtitle: 'Company', content: <span>body</span>, footer: <span>actions</span> }))
    expect(bar()?.textContent).toContain('Acme')
    expect(bar()?.textContent).toContain('Company')
    expect(host.querySelector('[data-slot="pane-body"]')?.textContent).toContain('body')
    expect(host.querySelector('[data-slot="pane-foot"]')?.textContent).toContain('actions')
    expect(host.querySelector('[aria-label="Close side panel"]')).toBeTruthy()
    // No page under this one, so no way back.
    expect(host.querySelector('[aria-label="Back"]')).toBeNull()
    press('Close side panel')
    expect(pane().getAttribute('aria-hidden')).toBe('true')
  })

  it('is a stack: push lays a page on top, back takes it off, back on the last closes', () => {
    let api!: DetailPaneApi
    docked((a) => (api = a))
    act(() => api.open({ title: 'Acme', content: <span>one</span> }))
    act(() => api.push({ title: 'Ada Lovelace', content: <span>two</span> }))
    expect(api.depth).toBe(2)
    expect(bar()?.textContent).toContain('Ada Lovelace')
    press('Back')
    expect(bar()?.textContent).toContain('Acme')
    expect(host.querySelector('[aria-label="Back"]')).toBeNull()
    act(() => api.back())
    expect(api.isOpen).toBe(false)
    // A push onto a shut pane starts a new stack rather than burying the old one.
    act(() => api.push({ title: 'Fresh', content: <span>three</span> }))
    expect(api.depth).toBe(1)
  })

  it('Escape from inside closes it; ⌘↵ runs the page’s expand, shown as a button', () => {
    let api!: DetailPaneApi
    const onExpand = vi.fn()
    docked((a) => (api = a))
    act(() => api.open({ title: 'Acme', content: <input data-field />, onExpand }))
    expect(host.querySelector('[aria-label="Open"]')).toBeTruthy()
    const field = host.querySelector('[data-field]') as HTMLElement
    key(field, 'Enter', { metaKey: true })
    expect(onExpand).toHaveBeenCalledTimes(1)
    key(field, 'Escape')
    expect(api.isOpen).toBe(false)
  })

  it('resizes from its leading edge by keyboard, within 320–600, and keeps the width', () => {
    let api!: DetailPaneApi
    docked((a) => (api = a))
    act(() => api.open({ title: 'Acme', content: <span>body</span> }))
    // jsdom lays nothing out; the column is as wide as its kept span.
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      // The kept width is the class useSpan's props draw until a drag writes the property.
      const kept = (el: HTMLElement) => parseFloat(el.style.getPropertyValue('--span')) || Number(/span-(\d+)px/.exec(el.className)?.[1]) || 0
      const w = this.dataset.slot === 'detail-pane' ? kept(this) : 0
      return { x: 0, y: 0, top: 0, left: 0, bottom: 0, right: w, width: w, height: 800, toJSON: () => ({}) } as DOMRect
    })
    const grip = host.querySelector('[data-slot="grip"]') as HTMLElement
    expect(grip.getAttribute('aria-label')).toBe('Resize side panel')
    expect(grip.getAttribute('aria-valuemin')).toBe('320')
    expect(grip.getAttribute('aria-valuemax')).toBe('600')
    expect(grip.getAttribute('aria-valuenow')).toBe('400')
    // Pinned on the right, so the left arrow widens it.
    key(grip, 'ArrowLeft')
    expect(grip.getAttribute('aria-valuenow')).toBe('408')
    expect(localStorage.getItem('hanzo.pane')).toBe('408')
    key(grip, 'End')
    expect(grip.getAttribute('aria-valuenow')).toBe('600')
    key(grip, 'Home')
    expect(grip.getAttribute('aria-valuenow')).toBe('320')
    rect.mockRestore()
  })

  it('opens at the width a person kept', () => {
    localStorage.setItem('hanzo.pane', '512')
    let api!: DetailPaneApi
    docked((a) => (api = a))
    act(() => api.open({ title: 'Acme', content: <span>body</span> }))
    expect(pane().className).toMatch(/span-512px/)
  })

  it('passes axe, open', async () => {
    let api!: DetailPaneApi
    docked((a) => (api = a))
    act(() => api.open({ title: 'Acme', content: <span>body</span>, footer: <button>Save</button>, onExpand: () => {} }))
    vi.useRealTimers()
    expect(await audit(host)).toEqual([])
  })
})

describe('an overlay pane', () => {
  it('keeps the sheet it always had on a regular surface', () => {
    let api!: DetailPaneApi
    mount(
      <DetailPane>
        <Capture onApi={(a) => (api = a)} />
      </DetailPane>,
    )
    act(() => api.open({ title: 'Machine gpu-1', content: <span>body</span> }))
    expect(host.querySelector('[role="dialog"]')).toBeTruthy()
    expect(bar()).toBeNull()
  })

  it('draws the record frame under a compact density', () => {
    let api!: DetailPaneApi
    mount(
      <Density value="compact">
        <DetailPane>
          <Capture onApi={(a) => (api = a)} />
        </DetailPane>
      </Density>,
    )
    act(() => api.open({ title: 'Acme', content: <span>body</span> }))
    expect(host.querySelector('[role="dialog"]')).toBeTruthy()
    expect(bar()?.textContent).toContain('Acme')
  })
})

describe('the frame parts outside a pane', () => {
  it('draw the bar without back or close, and the footer at the end', () => {
    mount(
      <>
        <PaneBar actions={<button>Act</button>}>title</PaneBar>
        <PaneBody>body</PaneBody>
        <PaneFoot>
          <button>Done</button>
        </PaneFoot>
      </>,
    )
    expect(bar()?.textContent).toContain('title')
    expect(host.querySelector('[aria-label="Close side panel"]')).toBeNull()
    expect(host.querySelector('[aria-label="Back"]')).toBeNull()
  })
})
