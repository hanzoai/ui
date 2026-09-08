// @vitest-environment jsdom

/**
 * ParticlesBackground draws through an imperative canvas loop, so behaviour is
 * asserted against a mocked 2D context and a manually-stepped animation frame
 * rather than against markup. `Math.random` is pinned so every particle seeds
 * at the same point — distance zero for every pair — which turns "how many
 * particles" and "how many connections" into exact, countable numbers.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { ParticlesBackground } from './particles-background'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

let rafCb: FrameRequestCallback | null = null
const tick = () => {
  const cb = rafCb
  rafCb = null
  cb?.(0)
}

type Ctx2D = {
  clearRect: ReturnType<typeof vi.fn>
  beginPath: ReturnType<typeof vi.fn>
  arc: ReturnType<typeof vi.fn>
  fill: ReturnType<typeof vi.fn>
  stroke: ReturnType<typeof vi.fn>
  moveTo: ReturnType<typeof vi.fn>
  lineTo: ReturnType<typeof vi.fn>
  fillStyle: string
  strokeStyle: string
  globalAlpha: number
  lineWidth: number
}

const makeCtx = (): Ctx2D => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  globalAlpha: 1,
  lineWidth: 0,
})

const mount = (node: React.ReactNode, ctx: Ctx2D = makeCtx()) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 200,
    height: 100,
    top: 0,
    left: 0,
    right: 200,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })

  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    ctx,
    frame: () => host.querySelector<HTMLElement>('[data-slot="particles-background"]'),
    canvas: () => host.querySelector<HTMLCanvasElement>('canvas'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('ParticlesBackground', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    rafCb = null
  })

  it('renders nothing before mount, so the server and first client paint match', () => {
    expect(renderToStaticMarkup(wrap(<ParticlesBackground />))).not.toContain('data-slot="particles-background"')
  })

  it('mounts a fixed, click-through canvas behind the page', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCb = null
    })

    const view = mount(<ParticlesBackground />)

    expect(view.frame()).toBeTruthy()
    expect(view.frame()!.style.position).toBe('fixed')
    expect(view.frame()!.style.pointerEvents).toBe('none')
    expect(view.frame()!.style.zIndex).toBe('-1')
    expect(view.canvas()).toBeTruthy()

    view.cleanup()
  })

  it('sizes the canvas to its box and seeds exactly particleCount particles', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCb = null
    })
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const view = mount(<ParticlesBackground particleCount={7} />)

    expect(view.canvas()!.width).toBe(200)
    expect(view.canvas()!.height).toBe(100)

    act(() => tick())
    expect(view.ctx.arc).toHaveBeenCalledTimes(7)

    view.cleanup()
  })

  it('joins every pair when all particles land on the same point, and skips it when none are close', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCb = null
    })

    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const close = mount(<ParticlesBackground particleCount={4} connectionDistance={100} />)
    act(() => tick())
    // 4 choose 2 = 6 pairs, all at distance 0
    expect(close.ctx.moveTo).toHaveBeenCalledTimes(6)
    expect(close.ctx.stroke).toHaveBeenCalledTimes(6)
    close.cleanup()

    vi.restoreAllMocks()
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCb = null
    })
    // Seed lands each of the 4 particles on a different corner of the
    // 200x100 canvas (x, y, then three don't-care draws for vx/vy/size).
    const corners = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]
    let call = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const particle = Math.floor(call / 5)
      const within = call % 5
      call += 1
      if (within === 0) return corners[particle][0]
      if (within === 1) return corners[particle][1]
      return 0.5
    })
    const far = mount(<ParticlesBackground particleCount={4} connectionDistance={1} />)
    act(() => tick())
    expect(far.ctx.moveTo).not.toHaveBeenCalled()
    far.cleanup()
  })

  it('paints with the given particle and line colours', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCb = null
    })
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const view = mount(
      <ParticlesBackground particleCount={2} particleColor="rgb(1, 2, 3)" lineColor="rgb(4, 5, 6)" />,
    )
    act(() => tick())

    expect(view.ctx.fillStyle).toBe('rgb(1, 2, 3)')
    expect(view.ctx.strokeStyle).toBe('rgb(4, 5, 6)')

    view.cleanup()
  })

  it('wires a mousemove listener only when mouse interaction is enabled', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCb = null
    })

    const addSpy = vi.spyOn(HTMLCanvasElement.prototype, 'addEventListener')
    const on = mount(<ParticlesBackground enableMouseInteraction />)
    expect(addSpy.mock.calls.some(([type]) => type === 'mousemove')).toBe(true)
    on.cleanup()

    addSpy.mockClear()
    const off = mount(<ParticlesBackground enableMouseInteraction={false} />)
    expect(addSpy.mock.calls.some(([type]) => type === 'mousemove')).toBe(false)
    off.cleanup()
  })

  it('tears down its listeners and animation frame on unmount', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    const cancelSpy = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancelSpy)

    const removeCanvasSpy = vi.spyOn(HTMLCanvasElement.prototype, 'removeEventListener')
    const removeWindowSpy = vi.spyOn(window, 'removeEventListener')

    const view = mount(<ParticlesBackground />)
    view.cleanup()

    expect(cancelSpy).toHaveBeenCalled()
    expect(removeCanvasSpy.mock.calls.some(([type]) => type === 'mousemove')).toBe(true)
    expect(removeWindowSpy.mock.calls.some(([type]) => type === 'resize')).toBe(true)
  })
})
