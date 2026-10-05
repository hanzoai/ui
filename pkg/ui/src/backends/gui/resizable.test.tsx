// @vitest-environment jsdom

/**
 * The split on a live DOM: a handle moves its boundary with the arrow keys,
 * says where it sits, remembers the layout under its `autoSaveId`, and a
 * double-click hands back the default.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'

const mount = () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() =>
    root.render(
      <GuiProvider config={config} defaultTheme="dark">
        <ResizablePanelGroup direction="horizontal" autoSaveId="split-test">
          <ResizablePanel defaultSize={60}>a</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={40}>b</ResizablePanel>
        </ResizablePanelGroup>
      </GuiProvider>,
    ),
  )
  const handle = host.querySelector<HTMLElement>('[role="separator"]')!
  return {
    handle,
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('ResizablePanelGroup', () => {
  it('moves by key, persists, and resets on a double-click', () => {
    localStorage.clear()
    const ui = mount()
    expect(ui.handle.getAttribute('aria-valuenow')).toBe('60')

    act(() => {
      ui.handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
    })
    expect(ui.handle.getAttribute('aria-valuenow')).toBe('65')
    expect(JSON.parse(localStorage.getItem('hanzo.panels.split-test') ?? '{}')).toEqual({ '0,1': [65, 35] })
    ui.cleanup()

    const again = mount()
    expect(again.handle.getAttribute('aria-valuenow')).toBe('65')
    act(() => {
      again.handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    expect(again.handle.getAttribute('aria-valuenow')).toBe('60')
    again.cleanup()
  })

  it('draws focus on its line, with no outline around the handle', () => {
    const ui = mount()
    const line = () => ui.handle.querySelector('.is_Separator')!
    const idle = [...line().classList].join(' ')
    expect(ui.handle.className).toMatch(/_outlineWidth-0px/)
    act(() => ui.handle.focus())
    expect(ui.handle.getAttribute('data-focused')).toBe('true')
    expect([...line().classList].join(' ')).not.toBe(idle)
    expect([...line().classList].join(' ')).toMatch(/_btc-outlineColo/)
    act(() => ui.handle.blur())
    expect([...line().classList].join(' ')).toBe(idle)
    ui.cleanup()
  })
})
