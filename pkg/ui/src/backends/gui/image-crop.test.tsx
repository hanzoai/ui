// @vitest-environment jsdom

/**
 * ImageCrop's behaviour, asserted on a live DOM: zoom and rotate change the
 * compiled transform on the pictured image, and Crop calls back with `src`.
 *
 * Imports `./image-crop` directly rather than the backend barrel — a test for
 * one component should not fail because a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { ImageCrop } from './image-crop'

const SRC = 'https://example.com/photo.jpg'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    host,
    button: (slot: string) => host.querySelector<HTMLElement>(`[data-slot="${slot}"]`),
    image: () => host.querySelector<HTMLImageElement>('[data-slot="image-crop-preview"] img'),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('ImageCrop', () => {
  it('renders the frame, the preview and every control', () => {
    const markup = html(<ImageCrop src={SRC} />)

    expect(markup).toContain('data-slot="image-crop"')
    expect(markup).toContain('data-slot="image-crop-preview"')
    expect(markup).toContain('data-slot="image-crop-controls"')
    for (const slot of ['image-crop-zoom-out', 'image-crop-zoom-in', 'image-crop-rotate', 'image-crop-crop'])
      expect(markup).toContain(`data-slot="${slot}"`)
  })

  it('holds the frame to the given aspect ratio', () => {
    const square = html(<ImageCrop src={SRC} />)
    const wide = html(<ImageCrop src={SRC} aspect={16 / 9} />)

    expect(square).toMatch(/data-slot="image-crop-preview"[^>]*data-ratio=""/)
    expect(wide).toMatch(/data-slot="image-crop-preview"[^>]*data-ratio=""/)
    // Different ratios compile to different inline/atomic aspect-ratio styles.
    const frame = (markup: string) => markup.match(/<div[^>]*data-slot="image-crop-preview"[^>]*>/)?.[0] ?? ''
    expect(frame(square)).not.toBe(frame(wide))
  })

  it('zooms in and out within 0.5–3, changing the pictured transform', () => {
    const view = mount(<ImageCrop src={SRC} />)
    const before = view.image()?.style.transform

    act(() => view.button('image-crop-zoom-in')?.click())
    const afterIn = view.image()?.style.transform
    expect(afterIn).not.toBe(before)
    expect(afterIn).toContain('scale(1.1)')

    // Back to 1, then floor at 0.5 no matter how many times it is pressed.
    act(() => view.button('image-crop-zoom-out')?.click())
    for (let i = 0; i < 20; i++) act(() => view.button('image-crop-zoom-out')?.click())
    expect(view.image()?.style.transform).toContain('scale(0.5)')

    view.cleanup()
  })

  it('rotates in 90° steps and wraps at 360', () => {
    const view = mount(<ImageCrop src={SRC} />)

    act(() => view.button('image-crop-rotate')?.click())
    expect(view.image()?.style.transform).toContain('rotate(90deg)')

    act(() => view.button('image-crop-rotate')?.click())
    act(() => view.button('image-crop-rotate')?.click())
    act(() => view.button('image-crop-rotate')?.click())
    expect(view.image()?.style.transform).toContain('rotate(0deg)')

    view.cleanup()
  })

  it('calls onCrop with the current src when Crop is pressed', () => {
    const onCrop = vi.fn()
    const view = mount(<ImageCrop src={SRC} onCrop={onCrop} />)

    act(() => view.button('image-crop-crop')?.click())

    expect(onCrop).toHaveBeenCalledWith(SRC)
    expect(onCrop).toHaveBeenCalledTimes(1)

    view.cleanup()
  })

  it('passes the src and alt text to the pictured image', () => {
    const markup = html(<ImageCrop src={SRC} />)

    expect(markup).toContain(`src="${SRC}"`)
    expect(markup).toContain('alt="Crop preview"')
  })
})
