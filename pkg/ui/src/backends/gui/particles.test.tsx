// @vitest-environment jsdom

/**
 * Particles is canvas-driven — jsdom implements neither `getContext('2d')` nor
 * `requestAnimationFrame`, so what is asserted here is the DOM contract
 * (the canvas mounts, sizes itself to its box, wires and unwires its
 * listeners) rather than pixels, which only a real browser can paint.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Particles } from './particles'

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
    canvas: () => host.querySelector<HTMLCanvasElement>('[data-slot="particles"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Particles', () => {
  it('mounts a canvas that covers its box and never blocks the pointer', () => {
    const view = mount(<Particles />)
    const canvas = view.canvas()!

    expect(canvas).toBeTruthy()
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas.style.position).toBe('absolute')
    expect(canvas.style.inset).toBe('0px')
    expect(canvas.style.pointerEvents).toBe('none')

    view.cleanup()
  })

  it('sizes the canvas to its bounding box on mount', () => {
    const view = mount(<Particles />)
    const canvas = view.canvas()!
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      width: 320,
      height: 240,
      top: 0,
      left: 0,
      right: 320,
      bottom: 240,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // A resize is what actually reads the mocked rect back onto the canvas.
    act(() => window.dispatchEvent(new Event('resize')))

    expect(canvas.width).toBe(320)
    expect(canvas.height).toBe(240)

    view.cleanup()
  })

  it('listens for the pointer only when interaction is enabled', () => {
    const on = mount(<Particles enableMouseInteraction />)
    const onCanvas = on.canvas()!
    const removeOn = vi.spyOn(onCanvas, 'removeEventListener')
    on.cleanup()
    expect(removeOn).toHaveBeenCalledWith('mousemove', expect.any(Function))

    const off = mount(<Particles enableMouseInteraction={false} />)
    const offCanvas = off.canvas()!
    const removeOff = vi.spyOn(offCanvas, 'removeEventListener')
    off.cleanup()
    expect(removeOff).not.toHaveBeenCalledWith('mousemove', expect.any(Function))
  })

  it('drops the resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const view = mount(<Particles />)
    view.cleanup()

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('carries the given class name onto the canvas frame', () => {
    const view = mount(<Particles className="field-backdrop" />)
    const canvas = view.canvas()!

    expect(canvas.className).toContain('field-backdrop')
    view.cleanup()
  })
})
