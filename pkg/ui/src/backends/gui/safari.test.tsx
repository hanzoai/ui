// @vitest-environment jsdom

/**
 * Safari's chrome, asserted on a live DOM: the traffic lights and URL render,
 * showToolbar toggles the secondary row, and every button fires its handler.
 *
 * Imports `./safari` directly rather than the backend barrel, so this test
 * only fails when this component (or something it directly imports) breaks.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Safari } from './safari'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    get: (slot: string) => host.querySelector<HTMLElement>(`[data-slot="${slot}"]`),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Safari', () => {
  it('renders the frame, traffic lights, url and content', () => {
    const view = mount(
      <Safari url="https://example.com">
        <div>page body</div>
      </Safari>,
    )

    expect(view.get('safari')).toBeTruthy()
    expect(view.get('safari-traffic-lights')?.children.length).toBe(3)
    expect(view.get('safari-url-text')?.textContent).toBe('https://example.com')
    expect(view.get('safari-content')?.textContent).toContain('page body')

    view.cleanup()
  })

  it('defaults the url to the ui.hanzo.ai homepage', () => {
    const view = mount(<Safari />)

    expect(view.get('safari-url-text')?.textContent).toBe('https://ui.hanzo.ai')

    view.cleanup()
  })

  it('shows the secondary toolbar by default and hides it when asked', () => {
    const shown = mount(<Safari />)
    expect(shown.get('safari-secondary-toolbar')).toBeTruthy()
    expect(shown.get('safari-toolbar-favorites')).toBeTruthy()
    expect(shown.get('safari-toolbar-reading-list')).toBeTruthy()
    expect(shown.get('safari-toolbar-history')).toBeTruthy()
    shown.cleanup()

    const hidden = mount(<Safari showToolbar={false} />)
    expect(hidden.get('safari-secondary-toolbar')).toBeFalsy()
    hidden.cleanup()
  })

  it('fires the nav, reload and action handlers when clicked', () => {
    const onBack = vi.fn()
    const onForward = vi.fn()
    const onReload = vi.fn()
    const onShare = vi.fn()
    const onNewTab = vi.fn()
    const onMenu = vi.fn()
    const view = mount(
      <Safari
        onBack={onBack}
        onForward={onForward}
        onReload={onReload}
        onShare={onShare}
        onNewTab={onNewTab}
        onMenu={onMenu}
      />,
    )

    act(() => view.get('safari-back')?.click())
    act(() => view.get('safari-forward')?.click())
    act(() => view.get('safari-reload')?.click())
    act(() => view.get('safari-share')?.click())
    act(() => view.get('safari-new-tab')?.click())
    act(() => view.get('safari-menu')?.click())

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onForward).toHaveBeenCalledTimes(1)
    expect(onReload).toHaveBeenCalledTimes(1)
    expect(onShare).toHaveBeenCalledTimes(1)
    expect(onNewTab).toHaveBeenCalledTimes(1)
    expect(onMenu).toHaveBeenCalledTimes(1)

    view.cleanup()
  })

  it('reports which secondary-toolbar item was pressed', () => {
    const onToolbarItemPress = vi.fn()
    const view = mount(<Safari onToolbarItemPress={onToolbarItemPress} />)

    act(() => view.get('safari-toolbar-reading-list')?.click())

    expect(onToolbarItemPress).toHaveBeenCalledWith('reading-list')

    view.cleanup()
  })
})
