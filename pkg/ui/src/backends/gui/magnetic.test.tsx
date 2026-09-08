// @vitest-environment jsdom

/**
 * The pull is a function of where the pointer is, and every claim below reads
 * the resulting inline transform off the DOM — never the text, because gui
 * drops a prop it does not recognise with no throw, so "it rendered" proves
 * nothing about whether a pointer reaches the frame.
 *
 * Imports `./magnetic` directly rather than the backend barrel: a test for one
 * component should not fail because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Magnetic } from './magnetic'

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

/** A live tree over a 200×100 box at the origin, so a corner is a known offset. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  const frame = host.querySelector<HTMLElement>('[data-slot="magnetic"]')!
  frame.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100, x: 0, y: 0 }) as DOMRect
  return {
    frame,
    move: (clientX: number, clientY: number) =>
      act(() => {
        frame.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX, clientY }))
      }),
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

describe('Magnetic', () => {
  it('rests at the origin, idle, with the settle transition armed', () => {
    const frame = tag(html(<Magnetic>go</Magnetic>), 'magnetic')

    expect(frame).toContain('data-state="idle"')
    expect(style(frame, 'transform')).toBe('translate(0px, 0px)')
    expect(style(frame, 'transition')).toBe('transform 150ms cubic-bezier(0.4, 0, 0.2, 1)')
  })

  it('pulls toward the pointer by strength times the distance from centre', () => {
    const view = mount(<Magnetic strength={0.3}>go</Magnetic>)

    // Centre of the 200×100 box is (100, 50); the pointer sits at (200, 0).
    view.move(200, 0)

    expect(view.frame.dataset.state).toBe('hover')
    expect(view.frame.style.transform).toBe('translate(30px, -15px)')
    view.cleanup()
  })

  it('scales the pull by strength', () => {
    const view = mount(<Magnetic strength={0.5}>go</Magnetic>)

    view.move(200, 0)

    expect(view.frame.style.transform).toBe('translate(50px, -25px)')
    view.cleanup()
  })

  it('snaps back to rest when the pointer leaves', () => {
    const view = mount(<Magnetic>go</Magnetic>)

    view.move(200, 0)
    expect(view.frame.dataset.state).toBe('hover')

    view.leave()

    expect(view.frame.dataset.state).toBe('idle')
    expect(view.frame.style.transform).toBe('translate(0px, 0px)')
    view.cleanup()
  })

  it('renders its child', () => {
    const markup = html(
      <Magnetic>
        <button type="button">Hover Me!</button>
      </Magnetic>,
    )

    expect(markup).toContain('Hover Me!')
  })
})
