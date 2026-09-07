// @vitest-environment jsdom

/**
 * DesktopWindow's behaviour, asserted on a live DOM: a click on a traffic
 * light fires its callback, double-clicking the title bar maximizes and
 * restores, dragging the title bar moves the frame, and dragging the corner
 * resizes it.
 *
 * Imports `./desktop-window` directly rather than the backend barrel, so this
 * test only fails when this component (or something it directly imports)
 * breaks.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { DesktopWindow, DesktopWindowControls } from './desktop-window'

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
    frame: () => host.querySelector<HTMLElement>('[data-slot="desktop-window"]'),
    titleBar: () => host.querySelector<HTMLElement>('[data-slot="desktop-window-title-bar"]'),
    handle: () => host.querySelector<HTMLElement>('[data-slot="desktop-window-resize-handle"]'),
    close: () => host.querySelector<HTMLElement>('[data-slot="desktop-window-close"]'),
    minimize: () => host.querySelector<HTMLElement>('[data-slot="desktop-window-minimize"]'),
    maximize: () => host.querySelector<HTMLElement>('[data-slot="desktop-window-maximize"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const pointer = (type: string, x: number, y: number, pointerId = 1) =>
  new PointerEvent(type, { clientX: x, clientY: y, pointerId, bubbles: true })

const translate = (el: HTMLElement) => {
  const m = el.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/)
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 }
}

describe('DesktopWindow', () => {
  it('renders the frame, title bar and content', () => {
    const view = mount(
      <DesktopWindow title="Editor">
        <div>body</div>
      </DesktopWindow>,
    )
    expect(view.frame()).toBeTruthy()
    expect(view.titleBar()).toBeTruthy()
    expect(view.frame()?.getAttribute('role')).toBe('dialog')
    expect(view.frame()?.getAttribute('aria-labelledby')).toBe('desktop-window-title-editor')
    expect(view.host.textContent).toContain('body')
    view.cleanup()
  })

  it('fires close, minimize and maximize from their traffic lights', () => {
    const onClose = vi.fn()
    const onMinimize = vi.fn()
    const onMaximize = vi.fn()
    const view = mount(
      <DesktopWindow title="App" onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize} />,
    )

    act(() => view.close()?.click())
    expect(onClose).toHaveBeenCalledTimes(1)

    act(() => view.minimize()?.click())
    expect(onMinimize).toHaveBeenCalledTimes(1)

    act(() => view.maximize()?.click())
    expect(onMaximize).toHaveBeenCalledTimes(1)

    view.cleanup()
  })

  it('hides the traffic lights with hideControls', () => {
    const view = mount(<DesktopWindow title="App" hideControls />)
    expect(view.close()).toBeNull()
    view.cleanup()
  })

  it('maximizes on double-click and restores on a second one', () => {
    const view = mount(
      <DesktopWindow title="App" initialPosition={{ x: 40, y: 60 }} initialSize={{ width: 500, height: 300 }} />,
    )
    const before = translate(view.frame()!)
    expect(before).toEqual({ x: 40, y: 60 })

    act(() => view.titleBar()?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
    expect(translate(view.frame()!)).toEqual({ x: 0, y: 0 })

    act(() => view.titleBar()?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))
    expect(translate(view.frame()!)).toEqual(before)

    view.cleanup()
  })

  it('moves the frame when the title bar is dragged', () => {
    const view = mount(
      <DesktopWindow title="App" initialPosition={{ x: 100, y: 100 }} initialSize={{ width: 400, height: 300 }} />,
    )
    const bar = view.titleBar()!
    Object.assign(bar, { setPointerCapture: () => {} })

    act(() => bar.dispatchEvent(pointer('pointerdown', 150, 120)))
    act(() => bar.dispatchEvent(pointer('pointermove', 170, 135)))
    act(() => bar.dispatchEvent(pointer('pointerup', 170, 135)))

    expect(translate(view.frame()!)).toEqual({ x: 120, y: 115 })
    view.cleanup()
  })

  it('resizes the frame when the corner handle is dragged', () => {
    const view = mount(
      <DesktopWindow
        title="App"
        initialSize={{ width: 400, height: 300 }}
        minWidth={100}
        minHeight={100}
      />,
    )
    const handle = view.handle()!
    Object.assign(handle, { setPointerCapture: () => {} })

    act(() => handle.dispatchEvent(pointer('pointerdown', 400, 300)))
    act(() => handle.dispatchEvent(pointer('pointermove', 460, 340)))
    act(() => handle.dispatchEvent(pointer('pointerup', 460, 340)))

    const frame = view.frame()!
    expect(frame.style.width).toBe('460px')
    expect(frame.style.height).toBe('340px')
    view.cleanup()
  })

  it('never shrinks below minWidth/minHeight while resizing', () => {
    const view = mount(
      <DesktopWindow title="App" initialSize={{ width: 400, height: 300 }} minWidth={300} minHeight={200} />,
    )
    const handle = view.handle()!
    Object.assign(handle, { setPointerCapture: () => {} })

    act(() => handle.dispatchEvent(pointer('pointerdown', 400, 300)))
    act(() => handle.dispatchEvent(pointer('pointermove', 0, 0)))
    act(() => handle.dispatchEvent(pointer('pointerup', 0, 0)))

    const frame = view.frame()!
    expect(frame.style.width).toBe('300px')
    expect(frame.style.height).toBe('200px')
    view.cleanup()
  })

  it('closes on Escape while the frame has focus', () => {
    const onClose = vi.fn()
    const view = mount(<DesktopWindow title="App" onClose={onClose} />)
    const frame = view.frame()!
    frame.focus()
    act(() => frame.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(onClose).toHaveBeenCalledTimes(1)
    view.cleanup()
  })

  it('renders no resize handle when resizable is false', () => {
    const view = mount(<DesktopWindow title="App" resizable={false} />)
    expect(view.handle()).toBeNull()
    view.cleanup()
  })
})

describe('DesktopWindowControls', () => {
  it('labels each light for the maximize/restore state', () => {
    const view = mount(<DesktopWindowControls isMaximized />)
    expect(view.maximize()?.getAttribute('aria-label')).toBe('Restore window')
    view.cleanup()
  })
})
