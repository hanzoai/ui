// @vitest-environment jsdom

/**
 * Asserts the desktop surface renders its slots and background, and that each
 * state hook behaves the way a window manager, a settings panel and a
 * shortcut table actually depend on — never on rendered text alone.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderHook } from '@testing-library/react'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Desktop,
  useDesktopSettings,
  useKeyboardShortcuts,
  useOverlayManager,
  useWindowManager,
} from './desktop'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

describe('Desktop', () => {
  it('renders the surface and, given one, the painted background', () => {
    const bare = html(<Desktop>content</Desktop>)
    expect(bare).toContain('data-slot="desktop"')
    expect(bare).toContain('data-slot="desktop-surface"')
    expect(bare).not.toContain('data-slot="desktop-background"')

    const painted = html(<Desktop background="linear-gradient(135deg, #1d4ed8, #7c3aed)">content</Desktop>)
    expect(painted).toContain('data-slot="desktop-background"')
    expect(painted).toContain('linear-gradient(135deg, #1d4ed8, #7c3aed)')
  })

  it('places children inside the surface', () => {
    const markup = html(
      <Desktop>
        <span data-testid="child">hi</span>
      </Desktop>,
    )
    expect(markup).toContain('data-testid="child"')
  })
})

describe('useWindowManager', () => {
  it('opens, focuses and closes windows by id', () => {
    const { result } = renderHook(() => useWindowManager(['Finder']))
    expect(result.current.isOpen('Finder')).toBe(false)

    act(() => result.current.openWindow('Finder'))
    expect(result.current.isOpen('Finder')).toBe(true)
    expect(result.current.activeWindow).toBe('Finder')
    expect(result.current.openWindows).toEqual(['Finder'])

    act(() => result.current.toggleWindow('Finder'))
    expect(result.current.isOpen('Finder')).toBe(false)
    expect(result.current.activeWindow).toBe(null)

    act(() => result.current.openWindow('Terminal'))
    act(() => result.current.closeAllWindows())
    expect(result.current.openWindows).toEqual([])
    expect(result.current.activeWindow).toBe(null)
  })
})

describe('useOverlayManager', () => {
  it('tracks spotlight and other overlays independently', () => {
    const { result } = renderHook(() => useOverlayManager())
    expect(result.current.isOpen('spotlight')).toBe(false)

    act(() => result.current.open('spotlight'))
    expect(result.current.isOpen('spotlight')).toBe(true)
    expect(result.current.isOpen('modal')).toBe(false)

    act(() => result.current.toggle('spotlight'))
    expect(result.current.isOpen('spotlight')).toBe(false)

    act(() => result.current.open('modal'))
    act(() => result.current.closeAll())
    expect(result.current.isOpen('modal')).toBe(false)
  })
})

describe('useDesktopSettings', () => {
  it('persists a changed setting to localStorage and reads it back', () => {
    window.localStorage.removeItem('desktop-settings')
    const { result, unmount } = renderHook(() => useDesktopSettings())
    expect(result.current.dockPosition).toBe('bottom')

    act(() => result.current.setDockPosition('left'))
    expect(result.current.dockPosition).toBe('left')
    expect(JSON.parse(window.localStorage.getItem('desktop-settings')!).dockPosition).toBe('left')

    act(() => result.current.toggleDarkMode())
    expect(result.current.colorScheme).toBe('light')

    unmount()
    window.localStorage.removeItem('desktop-settings')
  })
})

describe('useKeyboardShortcuts', () => {
  it('fires the matching shortcut on a real keydown', () => {
    let fired = 0
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)

    function Harness() {
      useKeyboardShortcuts([{ key: ' ', meta: true, action: () => fired++ }])
      return null
    }

    act(() => root.render(<Harness />))
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', metaKey: true }))
    })
    expect(fired).toBe(1)

    // A non-matching chord does nothing.
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', metaKey: false }))
    })
    expect(fired).toBe(1)

    act(() => root.unmount())
    host.remove()
  })
})
