import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APPEARANCE_STORAGE_KEY } from './appearance'
import { ThemeProvider, useTheme, type ThemeContextValue } from './react'

describe('React <ThemeProvider> and useTheme()', () => {
  let container: HTMLDivElement
  let root: Root
  let mediaListeners: Array<(event: MediaQueryListEvent) => void>
  let mediaMatches: boolean

  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    window.localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
    document.documentElement.removeAttribute('data-theme')

    mediaMatches = true
    mediaListeners = []
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: mediaMatches,
        media: query,
        onchange: null,
        addEventListener: (_event: string, listener: (e: MediaQueryListEvent) => void) => {
          mediaListeners.push(listener)
        },
        removeEventListener: (_event: string, listener: (e: MediaQueryListEvent) => void) => {
          mediaListeners = mediaListeners.filter((l) => l !== listener)
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    vi.unstubAllGlobals()
  })

  it('provides defaults, applies to document, updates via setTheme/setConfig, and migrates legacy lelouch', () => {
    let latest!: ThemeContextValue
    function Probe() {
      latest = useTheme()
      return <span data-testid="probe">{latest.resolvedThemeId}</span>
    }

    act(() => {
      root.render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      )
    })

    expect(latest.theme).toBe('zen')
    expect(latest.resolvedThemeId).toBe('zen')
    expect(latest.isDark).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('zen')

    act(() => {
      latest.setTheme('lelouch')
    })

    expect(latest.theme).toBe('clay')
    expect(latest.resolvedThemeId).toBe('clay')
    expect(document.documentElement.getAttribute('data-theme')).toBe('clay')

    act(() => {
      latest.setConfig({ borderRadius: 16, fontSize: 16, density: 'compact' })
    })

    expect(latest.config.borderRadius).toBe(16)
    expect(latest.config.fontSize).toBe(16)
    expect(latest.config.density).toBe('compact')
    expect(document.documentElement.style.getPropertyValue('--radius')).toBe('16px')

    act(() => {
      latest.reset()
    })

    expect(latest.theme).toBe('zen')
    expect(latest.config.borderRadius).toBe(8)
  })

  it('reacts to OS matchMedia dark-mode changes when theme is system', () => {
    let latest!: ThemeContextValue
    function Probe() {
      latest = useTheme()
      return null
    }

    act(() => {
      root.render(
        <ThemeProvider defaultConfig={{ theme: 'system' }}>
          <Probe />
        </ThemeProvider>,
      )
    })

    expect(latest.theme).toBe('system')
    expect(latest.resolvedThemeId).toBe('zen')
    expect(latest.isDark).toBe(true)

    act(() => {
      mediaMatches = false
      for (const listener of mediaListeners) {
        listener({ matches: false } as MediaQueryListEvent)
      }
    })

    expect(latest.resolvedThemeId).toBe('light')
    expect(latest.isDark).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('syncs cross-tab changes via window storage events', () => {
    let latest!: ThemeContextValue
    function Probe() {
      latest = useTheme()
      return null
    }

    act(() => {
      root.render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      )
    })

    expect(latest.theme).toBe('zen')

    const updated = JSON.stringify({ theme: 'grove', borderRadius: 12 })
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, updated)

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: APPEARANCE_STORAGE_KEY,
          newValue: updated,
        }),
      )
    })

    expect(latest.theme).toBe('grove')
    expect(latest.config.borderRadius).toBe(12)
    expect(document.documentElement.getAttribute('data-theme')).toBe('grove')
  })

  it('throws a clear error when useTheme() is called outside ThemeProvider', () => {
    function Orphan() {
      useTheme()
      return null
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => {
      act(() => {
        root.render(<Orphan />)
      })
    }).toThrow(/ThemeProvider/)
    spy.mockRestore()
  })
})
