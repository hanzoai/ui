// @vitest-environment jsdom

/**
 * The Android icon's contract, asserted on the compiled markup and on a live
 * DOM — never on "it rendered", because @hanzo/gui DROPS a prop it does not
 * recognise with no throw and no type error, so a mounted frame proves only
 * that a frame mounted.
 *
 * Imports `./android` directly rather than the backend barrel: the barrel pulls
 * the whole surface in, and a test for one component should not fail because
 * a different one's dependency moved.
 */
import { describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Android, type AndroidSize } from './android'

const wrap = (node: React.ReactNode) => (
  <GuiProvider config={config} defaultTheme="dark">
    {node}
  </GuiProvider>
)

const html = (node: React.ReactNode) => renderToStaticMarkup(wrap(node))

/** A live tree — the only place a click means anything. */
const mount = (node: React.ReactNode) => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(wrap(node)))
  return {
    frame: () => host.querySelector<HTMLElement>('[data-slot="android"]')!,
    cleanup: () => {
      act(() => root.unmount())
      host.remove()
    },
  }
}

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

/** The compiled class for one style property, e.g. cls(el, 'width'). */
const cls = (el: string, prop: string) =>
  (el.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/).find((c) => c.startsWith(`_${prop}-`)) ?? ''

const svg = (markup: string) => markup.match(/<svg[^>]*>/)?.[0] ?? ''

const fills = (markup: string) => [...markup.matchAll(/<path[^>]*fill="([^"]+)"/g)].map((m) => m[1])
const strokes = (markup: string) =>
  [...markup.matchAll(/<path[^>]*stroke="([^"]+)"/g)].map((m) => m[1])
const eyes = (markup: string) => [...markup.matchAll(/<circle[^>]*fill="([^"]+)"/g)].map((m) => m[1])

const EDGE: Record<AndroidSize, number> = { sm: 16, default: 24, lg: 32, xl: 48 }

describe('Android', () => {
  it('is a named image with the drawing hidden from the reader', () => {
    const markup = html(<Android />)
    const frame = tag(markup, 'android')

    expect(frame).not.toBe('')
    expect(frame).toContain('role="img"')
    expect(frame).toContain('aria-label="Android"')
    expect(frame).toContain('data-size="default"')
    // One label, on the frame; the <svg> inside says nothing of its own.
    expect(svg(markup)).toContain('aria-hidden="true"')
    expect(svg(markup)).toContain('viewBox="0 0 24 24"')
  })

  it('sizes the frame on the 16/24/32/48 ladder and the drawing fills it', () => {
    for (const size of Object.keys(EDGE) as AndroidSize[]) {
      const markup = html(<Android size={size} />)
      const frame = tag(markup, 'android')

      expect(frame, size).toContain(`data-size="${size}"`)
      expect(cls(frame, 'width'), size).toBe(`_width-${EDGE[size]}px`)
      expect(cls(frame, 'height'), size).toBe(`_height-${EDGE[size]}px`)
      // The frame is the one owner of the size; the drawing takes all of it.
      expect(svg(markup), size).toContain('width="100%"')
      expect(svg(markup), size).toContain('height="100%"')
    }
  })

  it('carries the drawing with a width set on the frame', () => {
    const markup = html(<Android width={20} height={20} />)
    const frame = tag(markup, 'android')

    expect(cls(frame, 'width')).toBe('_width-20px')
    expect(cls(frame, 'height')).toBe('_height-20px')
    expect(svg(markup)).toContain('width="100%"')
  })

  it('treats a null size as the default', () => {
    const frame = tag(html(<Android size={null} />), 'android')

    expect(frame).toContain('data-size="default"')
    expect(cls(frame, 'width')).toBe('_width-24px')
  })

  it('inherits the surrounding ink by default and gives the eyes white', () => {
    const markup = html(<Android />)

    // currentColor is only the surrounding text's if the frame sets no ink of
    // its own — a color class here would be what the drawing inherits instead.
    expect(cls(tag(markup, 'android'), 'col')).toBe('')
    // Body, head, two arms — every filled part takes the text color.
    expect(fills(markup)).toEqual(['currentColor', 'currentColor', 'currentColor', 'currentColor'])
    // …and both antennae are stroked in it.
    expect(strokes(markup)).toEqual(['currentColor', 'currentColor'])
    expect(eyes(markup)).toEqual(['#ffffff', '#ffffff'])
  })

  it('fills every part with a named color and turns the eyes black on it', () => {
    const markup = html(<Android color="#3DDC84" />)

    expect(fills(markup)).toEqual(['#3DDC84', '#3DDC84', '#3DDC84', '#3DDC84'])
    expect(strokes(markup)).toEqual(['#3DDC84', '#3DDC84'])
    expect(eyes(markup)).toEqual(['#000000', '#000000'])
  })

  it('lets the caller rename or hide it', () => {
    expect(tag(html(<Android aria-label="Get it on Android" />), 'android')).toContain(
      'aria-label="Get it on Android"',
    )
    expect(tag(html(<Android aria-hidden />), 'android')).toContain('aria-hidden="true"')
  })

  it('takes its ink from class notation on the frame', () => {
    // `text-ink` in a class string inks the robot: the color lands on the frame
    // and currentColor reads it from there.
    expect(cls(tag(html(<Android className="text-ink" />), 'android'), 'col')).toBe('_col-ink')
  })

  it('reads a class string as style and never leaks a style prop as an attribute', () => {
    const markup = html(<Android className="ml-2 hz-mark" />)
    const frame = tag(markup, 'android')

    // `ml-2` is class notation this package reads; `hz-mark` is a real rule
    // somewhere else and survives untouched.
    expect(cls(frame, 'ml')).not.toBe('')
    expect(frame).toMatch(/class="[^"]*\bhz-mark\b/)
    for (const leak of ['backgroundcolor=', 'alignitems=', 'flexshrink=', 'display='])
      expect(markup, leak).not.toContain(leak)
  })

  it('sits inline and shrink-wraps its drawing', () => {
    const frame = tag(html(<Android />), 'android')

    expect(cls(frame, 'dsp')).toBe('_dsp-inline-flex')
    expect(cls(frame, 'shrink')).toBe('_shrink-0')
  })

  it('is phrasing content, so it stays inside a line of text', () => {
    const markup = html(
      <p>
        Get it on <Android /> today
      </p>,
    )

    // A <div> here would end the paragraph at the icon in every browser's
    // parser, and the hydrated tree would then disagree with the markup.
    expect(tag(markup, 'android')).toMatch(/^<span\b/)
    expect(markup).toMatch(/<p>Get it on <span[^>]*data-slot="android"[\s\S]*<\/span> today<\/p>/)
  })

  it('answers a press on the frame', () => {
    const onPress = vi.fn()
    const view = mount(<Android onPress={onPress} />)

    act(() => {
      view.frame().click()
    })

    expect(onPress).toHaveBeenCalledTimes(1)
    view.cleanup()
  })
})
