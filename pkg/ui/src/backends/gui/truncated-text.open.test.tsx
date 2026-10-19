// @vitest-environment jsdom

/**
 * When the hint opens. gui's Tooltip is stubbed to record the `open` it is
 * handed, because the panel is portalled and positioned at run time; what is
 * asserted is the decision: after the delay, and only for a text that was cut
 * (or always, when asked), at once on focus, closed on leave and on blur.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const opens: boolean[] = []

vi.mock('@hanzo/gui', async (importActual) => {
  const actual = await importActual<Record<string, unknown>>()
  const Tip = ({ open, children }: { open?: boolean; children?: React.ReactNode }) => {
    opens.push(!!open)
    return <div data-open={open ? 'yes' : 'no'}>{children}</div>
  }
  Tip.Anchor = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  Tip.Trigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>
  Tip.Content = () => null
  return { ...actual, Tooltip: Tip }
})

vi.mock('../../product/menu/portal-theme', () => ({
  PortalTheme: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  useThemeName: () => 'dark',
}))

const { GuiProvider } = await import('@hanzo/gui')
const { default: config } = await import('../../gui-config')
const { TruncatedText } = await import('./truncated-text')

let host: HTMLDivElement
let root: Root
beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  act(() => root.unmount())
  host.remove()
})

const Pointer = (globalThis.PointerEvent ?? MouseEvent) as typeof MouseEvent
const size = (el: Element, scroll: number, client: number) => {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: scroll })
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: client })
}
const mount = (node: React.ReactNode) =>
  act(() => root.render(<GuiProvider config={config} defaultTheme="dark">{node}</GuiProvider>))
const text = () => host.querySelector('[data-slot="truncated-text"]') as HTMLElement
const state = () => host.querySelector('[data-open]')?.getAttribute('data-open')

describe('TruncatedText opens its hint', () => {
  it('after the 500ms delay, for a cut text', () => {
    mount(<TruncatedText text="a label that was cut" />)
    size(text(), 300, 100)
    act(() => {
      text().dispatchEvent(new Pointer('pointerover', { bubbles: true }))
      vi.advanceTimersByTime(400)
    })
    expect(state()).toBe('no')
    act(() => vi.advanceTimersByTime(150))
    expect(state()).toBe('yes')
    act(() => text().dispatchEvent(new Pointer('pointerout', { bubbles: true })))
    expect(state()).toBe('no')
  })

  it('never for a text that fits', () => {
    mount(<TruncatedText text="fits" />)
    size(text(), 100, 100)
    act(() => {
      text().dispatchEvent(new Pointer('pointerover', { bubbles: true }))
      vi.advanceTimersByTime(1000)
    })
    expect(state()).toBe('no')
  })

  it('always, when asked, even if it fits', () => {
    mount(<TruncatedText text="fits" alwaysShowTooltip />)
    size(text(), 100, 100)
    act(() => {
      text().dispatchEvent(new Pointer('pointerover', { bubbles: true }))
      vi.advanceTimersByTime(600)
    })
    expect(state()).toBe('yes')
  })

  it('at once on focus, and closes on blur', () => {
    mount(<TruncatedText text="focused and cut" isFocusable />)
    size(text(), 300, 100)
    act(() => {
      text().focus()
      vi.advanceTimersByTime(1)
    })
    expect(state()).toBe('yes')
    act(() => text().blur())
    expect(state()).toBe('no')
  })
})
