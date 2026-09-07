// @vitest-environment jsdom

/**
 * The tilt is a function of where the pointer is, and every claim below reads
 * the resulting inline transform off the DOM — never the text, because gui
 * drops a prop it does not recognise with no throw, so "it rendered" proves
 * nothing about whether a pointer reaches the frame.
 *
 * Imports `./3d-card` directly rather than the backend barrel: a test for one
 * component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Card3D,
  Card3DContent,
  Card3DDescription,
  Card3DFooter,
  Card3DHeader,
  Card3DTitle,
} from './3d-card'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** One declaration out of an open tag's inline style, e.g. style(el, 'transform'). */
const style = (el: string, prop: string) =>
  (el.match(/style="([^"]*)"/)?.[1] ?? '')
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${prop}:`))
    ?.slice(prop.length + 1) ?? ''

const full = (extra?: Partial<React.ComponentProps<typeof Card3D>>) => (
  <Card3D {...extra}>
    <Card3DHeader>
      <Card3DTitle>Tilt</Card3DTitle>
      <Card3DDescription>Turns toward the pointer</Card3DDescription>
    </Card3DHeader>
    <Card3DContent>body</Card3DContent>
    <Card3DFooter>foot</Card3DFooter>
  </Card3D>
)

/** A live tree over a 200×100 box at the origin, so a corner is a known fraction. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  const frame = host.querySelector<HTMLElement>('[data-slot="3d-card"]')!
  frame.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0 }) as DOMRect
  return {
    frame,
    glare: () => host.querySelector<HTMLElement>('[data-slot="3d-card-glare"]'),
    move: (clientX: number, clientY: number, pointerType = 'mouse') =>
      act(() => {
        frame.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY, pointerType }))
      }),
    lift: (pointerType: string) =>
      act(() => {
        frame.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType }))
      }),
    // React derives onPointerLeave from pointerout with a relatedTarget outside
    // the node — or none, which is what a browser sends after a touch lifts.
    leave: (pointerType = 'mouse', relatedTarget: Element | null = document.body) =>
      act(() => {
        frame.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType, relatedTarget }))
      }),
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('Card3D', () => {
  it('rests flat, in its own 3D space, with the settle transition armed', () => {
    const frame = tag(html(full()), '3d-card')

    expect(frame).toContain('data-state="idle"')
    expect(style(frame, 'transform')).toBe('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)')
    expect(style(frame, 'transition')).toBe('transform 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99)')
    // Without this the layers' translateZ flattens into the frame and depth is inert.
    expect(style(frame, 'transform-style')).toBe('preserve-3d')
    // A finger has to reach pointermove; otherwise the browser reads the drag as
    // a scroll and cancels the stream on the first pixel.
    expect(style(frame, 'touch-action')).toBe('none')
  })

  it('stands every layer off the surface at its own depth', () => {
    const markup = html(full())

    expect(style(tag(markup, '3d-card-header'), 'transform')).toBe('translateZ(20px)')
    expect(style(tag(markup, '3d-card-title'), 'transform')).toBe('translateZ(30px)')
    expect(style(tag(markup, '3d-card-description'), 'transform')).toBe('translateZ(10px)')
    expect(style(tag(markup, '3d-card-content'), 'transform')).toBe('translateZ(25px)')
    expect(style(tag(markup, '3d-card-footer'), 'transform')).toBe('translateZ(15px)')
  })

  it('takes a depth per layer', () => {
    const markup = html(
      <Card3D>
        <Card3DTitle depth={80}>far</Card3DTitle>
        <Card3DContent depth={0}>flat</Card3DContent>
      </Card3D>,
    )

    expect(style(tag(markup, '3d-card-title'), 'transform')).toBe('translateZ(80px)')
    expect(style(tag(markup, '3d-card-content'), 'transform')).toBe('translateZ(0px)')
  })

  it('keeps a layer at its depth under a style the caller adds', () => {
    const markup = html(
      <Card3D>
        <Card3DTitle style={{ opacity: 0.5 }}>tinted</Card3DTitle>
        <Card3DFooter style={{ transform: 'translateZ(5px)' }}>overridden</Card3DFooter>
      </Card3D>,
    )
    const title = tag(markup, '3d-card-title')

    expect(style(title, 'transform')).toBe('translateZ(30px)')
    expect(style(title, 'opacity')).toBe('0.5')
    // A caller's own transform wins, as it would on a plain element.
    expect(style(tag(markup, '3d-card-footer'), 'transform')).toBe('translateZ(5px)')
  })

  it('hides the glare at rest and drops it entirely for glare={false}', () => {
    const on = tag(html(full()), '3d-card-glare')
    expect(on).not.toBe('')
    expect(style(on, 'opacity')).toBe('0')
    // It cannot catch the pointer the frame is listening for.
    expect(on).toContain('_pe-none')
    // Above the deepest default layer, shrunk to the card's edge.
    expect(style(on, 'transform')).toBe('translateZ(40px) scale(0.96)')

    expect(html(full({ glare: false }))).not.toContain('3d-card-glare')
  })

  it('reads perspective, speed and glare alpha into the styles it emits', () => {
    const markup = html(full({ perspective: 500, speed: 250, glareMaxOpacity: 0.4 }))
    const frame = tag(markup, '3d-card')
    const glare = tag(markup, '3d-card-glare')

    expect(style(frame, 'transform')).toContain('perspective(500px)')
    expect(style(frame, 'transition')).toContain('transform 250ms')
    expect(style(glare, 'transition')).toBe('opacity 250ms ease-out')
    expect(style(glare, 'background')).toContain('rgba(255,255,255,0.4)')
    expect(style(glare, 'transform')).toBe('translateZ(40px) scale(0.92)')
  })

  it('turns toward the pointer and lights the glare under it', () => {
    const view = mount(full())

    view.move(200, 0)

    expect(view.frame.dataset.state).toBe('hover')
    // Top-right corner: the top tips toward the viewer, the right edge away.
    expect(view.frame.style.transform).toBe('perspective(1000px) rotateX(15deg) rotateY(15deg) scale(1.05)')
    // No easing WHILE the pointer moves, or the card lags the hand.
    expect(view.frame.style.transition).toBe('none')
    expect(view.glare()!.style.opacity).toBe('1')
    expect(view.glare()!.style.background).toContain('circle at 100% 0%')

    view.move(100, 50)
    expect(view.frame.style.transform).toBe('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.05)')
    expect(view.glare()!.style.background).toContain('circle at 50% 50%')

    view.cleanup()
  })

  it('scales the turn by maxTilt and the growth by scale', () => {
    const view = mount(full({ maxTilt: 10, scale: 1.1 }))

    view.move(0, 100)

    expect(view.frame.style.transform).toBe('perspective(1000px) rotateX(-10deg) rotateY(-10deg) scale(1.1)')
    view.cleanup()
  })

  it('settles flat when the mouse leaves, fading the glare where it was', () => {
    const view = mount(full())

    view.move(200, 0)
    view.leave()

    expect(view.frame.dataset.state).toBe('idle')
    expect(view.frame.style.transform).toBe('perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)')
    expect(view.frame.style.transition).toContain('transform 400ms')
    expect(view.glare()!.style.opacity).toBe('0')
    expect(view.glare()!.style.transition).toBe('opacity 400ms ease-out')
    expect(view.glare()!.style.background).toContain('circle at 100% 0%')
    view.cleanup()
  })

  it('settles when a finger lifts, and not when a mouse button does', () => {
    const view = mount(full())

    view.move(200, 0, 'touch')
    expect(view.frame.dataset.state).toBe('hover')
    // A touch cannot hover, so its pointerup is followed by a pointerout that
    // names no relatedTarget: that, not the lift itself, is what settles it.
    view.lift('touch')
    expect(view.frame.dataset.state).toBe('hover')
    view.leave('touch', null)
    expect(view.frame.dataset.state).toBe('idle')

    view.move(200, 0)
    view.lift('mouse')
    expect(view.frame.dataset.state).toBe('hover')
    view.cleanup()
  })
})
