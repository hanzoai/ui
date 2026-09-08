// @vitest-environment jsdom

/**
 * ImageZoom's magnify contract, asserted on a live DOM — a pointer move and a
 * pointer leave only mean anything once the transform is read back off the
 * rendered node.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { ImageZoom } from './image-zoom'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

/** A live tree, with a real rect on the frame so the pointer fraction means something. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  const frame = host.querySelector<HTMLElement>('[data-slot="image-zoom"]')!
  frame.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0 }) as DOMRect
  return {
    frame,
    image: () => host.querySelector<HTMLElement>('[data-slot="image-zoom-image"]')!,
    glyph: () => host.querySelector<HTMLElement>('[data-slot="image-zoom-glyph"]')!,
    move: (clientX: number, clientY: number) =>
      act(() => {
        frame.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY }))
      }),
    // React derives onPointerLeave from pointerout with a relatedTarget outside
    // the node.
    leave: () =>
      act(() => {
        frame.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }))
      }),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('ImageZoom', () => {
  it('renders the frame, the image and the glyph', () => {
    const markup = html(<ImageZoom src="/cat.jpg" alt="A cat" />)

    expect(markup).toContain('data-slot="image-zoom"')
    expect(markup).toContain('data-slot="image-zoom-image"')
    expect(markup).toContain('data-slot="image-zoom-glyph"')
    expect(markup).toContain('alt="A cat"')
    expect(markup).toContain('data-state="idle"')
  })

  it('is at rest scale before the pointer arrives', () => {
    const markup = html(<ImageZoom src="/cat.jpg" alt="A cat" />)
    const img = markup.match(/<img[^>]*data-slot="image-zoom-image"[^>]*>/)?.[0] ?? ''

    expect(img).toMatch(/scale\(1\)/)
  })

  it('scales up by zoomScale and flips to the zoomed state on a move', () => {
    const view = mount(<ImageZoom src="/cat.jpg" alt="A cat" zoomScale={3} />)

    view.move(100, 50)

    expect(view.frame.getAttribute('data-state')).toBe('zoomed')
    expect(view.image().style.transform).toContain('scale(3)')

    view.cleanup()
  })

  it('moves the transform origin toward wherever the pointer sits', () => {
    const view = mount(<ImageZoom src="/cat.jpg" alt="A cat" />)

    // frame is 200×100: (10, 10) is near the top-left corner.
    view.move(10, 10)
    expect(view.image().style.transformOrigin).toBe('5% 10%')

    // (180, 90) is near the bottom-right corner.
    view.move(180, 90)
    expect(view.image().style.transformOrigin).toBe('90% 90%')

    view.cleanup()
  })

  it('settles back to rest scale and the idle state on pointer leave', () => {
    const view = mount(<ImageZoom src="/cat.jpg" alt="A cat" />)

    view.move(100, 50)
    expect(view.frame.getAttribute('data-state')).toBe('zoomed')

    view.leave()

    expect(view.frame.getAttribute('data-state')).toBe('idle')
    expect(view.image().style.transform).toContain('scale(1)')

    view.cleanup()
  })

  it('fades the glyph in only while zoomed', () => {
    const view = mount(<ImageZoom src="/cat.jpg" alt="A cat" />)
    const idleClass = view.glyph().className

    view.move(100, 50)
    const zoomedClass = view.glyph().className

    // gui compiles the `zoomed` variant's opacity to a class (`_o-1`), not an
    // inline style — the class list differs between the two states.
    expect(zoomedClass).not.toBe(idleClass)
    expect(zoomedClass.split(/\s+/)).toContain('_o-1')
    expect(idleClass.split(/\s+/)).not.toContain('_o-1')

    view.leave()
    expect(view.glyph().className).toBe(idleClass)

    view.cleanup()
  })
})
