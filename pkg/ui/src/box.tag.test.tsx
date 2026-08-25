/**
 * Box renders the element it stands in for.
 *
 * A div is about a third of what carries a className in the apps migrating off a
 * utility engine; the rest are `p`, `span`, `li`, `h2`, `section`, `a`. Without
 * this, converting them reads as a rename and in fact strips the document of its
 * headings, lists and paragraphs — each one a thing a screen reader navigates by,
 * and none of it visible in a screenshot.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'
import config from './gui-config'
import { Box } from './box'

const html = (ui: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config as never} defaultTheme="dark">{ui}</GuiProvider>,
  )

/** The element holding the content, past the stylesheet gui injects first. */
const elementOf = (out: string) =>
  /<(\w+)[^>]*>x/.exec(out.replace(/<style[\s\S]*?<\/style>/g, ''))?.[1]

describe('Box tag', () => {
  it('is a div when nothing asks otherwise', () => {
    expect(elementOf(html(<Box>x</Box>))).toBe('div')
  })

  it('renders each element it is asked for', () => {
    const tags = ['p', 'span', 'section', 'h1', 'h2', 'ul', 'li', 'a', 'main', 'nav'] as const
    expect(tags.map((t) => elementOf(html(<Box tag={t}>x</Box>)))).toEqual([...tags])
  })

  it('never leaks `tag` as a DOM attribute', () => {
    // gui does: asked for one it renders its own element AND passes the prop
    // through, where `tag="section"` is invalid markup. Going through asChild is
    // what avoids that, so this is the regression that would say it stopped.
    expect(html(<Box tag="section">x</Box>)).not.toMatch(/\stag="/)
  })

  it('still converts utility classes when it is not a div', () => {
    const out = html(<Box tag="section" className="flex items-center">x</Box>)
    const cls = /<section[^>]*class="([^"]*)"/.exec(out)?.[1] ?? ''
    expect(cls).toMatch(/_dsp-flex/)
  })

  it('still keeps a class it could not read', () => {
    // `group` is selected on by another rule; dropping it breaks that rule
    // silently, and under asChild the class rides on the child or nowhere.
    expect(html(<Box tag="li" className="flex group">x</Box>)).toContain('group')
  })

  it('still renders a text size the frame would have dropped', () => {
    // fontSize is not a frame style prop. Under asChild there IS no frame, so it
    // has to ride on the element itself or a converted `text-xs` does nothing.
    expect(html(<Box tag="p" className="text-xs">x</Box>)).toMatch(/font-size:\s*var\(--text-xs\)/)
  })
})

describe('Box drops nothing a frame would swallow', () => {
  it('keeps tabular-nums, which is what lines a money column up', () => {
    // tw converts it to fontVariantNumeric; a frame drops that like any other
    // text property, and the loss shows only as a figure measuring a couple of
    // pixels wider — invisible to a test that asserts on text.
    expect(html(<Box className="tabular-nums">x</Box>))
      .toMatch(/font-variant-numeric:\s*tabular-nums/)
    expect(html(<Box tag="span" className="tabular-nums">x</Box>))
      .toMatch(/font-variant-numeric:\s*tabular-nums/)
  })

  it('leaves min-width auto, like the div it replaces', () => {
    // A View pins min-width 0; auto is what stops a flex child shrinking below
    // its own content.
    expect(html(<Box className="flex">x</Box>)).toMatch(/min-width:\s*auto/)
  })
})
