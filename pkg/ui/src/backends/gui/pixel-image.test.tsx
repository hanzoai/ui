// @vitest-environment jsdom

/**
 * PixelImage's behaviour, asserted on a live DOM. jsdom implements neither
 * `Image` decoding nor `CanvasRenderingContext2D`, so both are stubbed here —
 * `Image` fires `onload` synchronously with a fixed size, and the 2D context
 * records every call so the pixelation loop can be asserted directly: one
 * `fillRect` per block, stepped by `pixelSize`, and a colour read back from the
 * fabricated source pixels.
 *
 * Imports `./pixel-image` directly rather than the backend barrel — a test for
 * one component should not fail because a different one's dependency moved.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { PixelImage } from './pixel-image'

const SRC = 'https://example.com/photo.jpg'
const SIZE = 4

class FakeImage {
  crossOrigin = ''
  width = SIZE
  height = SIZE
  onload: (() => void) | null = null
  set src(_value: string) {
    this.onload?.()
  }
}

const ctxLog = { fillRect: [] as Array<[number, number, number, number]>, fillStyle: [] as string[] }

const makeCtx = () => ({
  imageSmoothingEnabled: true,
  drawImage: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    // One flat colour per pixel, distinct per row, so a fill can be traced
    // back to the block it came from.
    data: new Uint8ClampedArray(
      Array.from({ length: SIZE * SIZE }, (_, i) => {
        const row = Math.floor(i / SIZE)
        return [row * 10, row * 20, row * 30, 255]
      }).flat(),
    ),
  })),
  set fillStyle(value: string) {
    ctxLog.fillStyle.push(value)
  },
  fillRect: (x: number, y: number, w: number, h: number) => {
    ctxLog.fillRect.push([x, y, w, h])
  },
})

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
    canvas: () => host.querySelector<HTMLCanvasElement>('[data-slot="pixel-image-canvas"]'),
    frame: () => host.querySelector<HTMLElement>('[data-slot="pixel-image"]'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

let originalImage: typeof Image

beforeEach(() => {
  ctxLog.fillRect = []
  ctxLog.fillStyle = []
  originalImage = globalThis.Image
  globalThis.Image = FakeImage as unknown as typeof Image
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    makeCtx() as unknown as CanvasRenderingContext2D,
  )
})

afterEach(() => {
  globalThis.Image = originalImage
  vi.restoreAllMocks()
})

describe('PixelImage', () => {
  it('renders the frame and the canvas it draws into', () => {
    const view = mount(<PixelImage src={SRC} />)

    expect(view.frame()).not.toBeNull()
    expect(view.canvas()).not.toBeNull()
    expect(view.canvas()?.getAttribute('data-pixel-size')).toBe('10')

    view.cleanup()
  })

  it('sizes the canvas to the loaded image and marks the frame loaded', () => {
    const view = mount(<PixelImage src={SRC} pixelSize={2} />)

    expect(view.canvas()?.width).toBe(SIZE)
    expect(view.canvas()?.height).toBe(SIZE)
    expect(view.frame()?.getAttribute('data-loaded')).toBe('true')

    view.cleanup()
  })

  it('fills one block per pixelSize step, covering the whole canvas', () => {
    const view = mount(<PixelImage src={SRC} pixelSize={2} />)

    // A 4x4 canvas stepped by 2 is a 2x2 grid of blocks.
    expect(ctxLog.fillRect).toHaveLength(4)
    expect(ctxLog.fillRect).toEqual(
      expect.arrayContaining([
        [0, 0, 2, 2],
        [2, 0, 2, 2],
        [0, 2, 2, 2],
        [2, 2, 2, 2],
      ]),
    )

    view.cleanup()
  })

  it('colours each block from the source pixel it starts at', () => {
    mount(<PixelImage src={SRC} pixelSize={2} />)

    // Row 0 of the fabricated source is rgb(0, 0, 0); row 2 is rgb(20, 40, 60).
    expect(ctxLog.fillStyle[0]).toBe('rgba(0, 0, 0, 1)')
    expect(ctxLog.fillStyle).toContain('rgba(20, 40, 60, 1)')
  })

  it('redraws with a different block count when pixelSize changes', () => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    act(() => root.render(wrap(<PixelImage src={SRC} pixelSize={2} />)))
    expect(ctxLog.fillRect).toHaveLength(4)

    ctxLog.fillRect = []
    act(() => root.render(wrap(<PixelImage src={SRC} pixelSize={4} />)))
    // A 4x4 canvas stepped by 4 is a single block.
    expect(ctxLog.fillRect).toHaveLength(1)
    expect(ctxLog.fillRect[0]).toEqual([0, 0, 4, 4])

    act(() => root.unmount())
    host.remove()
  })

  it('labels the canvas as an image when alt is given', () => {
    const view = mount(<PixelImage src={SRC} alt="A pixelated photo" />)

    expect(view.canvas()?.getAttribute('role')).toBe('img')
    expect(view.canvas()?.getAttribute('aria-label')).toBe('A pixelated photo')

    view.cleanup()
  })
})
