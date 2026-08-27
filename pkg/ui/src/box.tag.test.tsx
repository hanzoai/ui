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

/**
 * The class list on the element we asked for.
 *
 * Anchored on the CONTENT, because the provider wraps everything in a span of
 * its own — so a test asking about `<span>` otherwise reads the wrapper's
 * classes and reports that Box did nothing.
 */
const classOf = (out: string, tag: string) =>
  new RegExp(`<${tag}[^>]*class="([^"]*)"[^>]*>x`).exec(
    out.replace(/<style[\s\S]*?<\/style>/g, ''),
  )?.[1] ?? ''

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

describe("Box hands the element its own attributes", () => {
  it('puts href on the anchor, where a link needs it', () => {
    // With asChild these used to ride on the frame, which has no use for them —
    // an <a> with no href is not a link, and nothing about it looks wrong.
    expect(html(<Box tag="a" href="/x">x</Box>)).toMatch(/<a[^>]*href="\/x"/)
  })

  it('puts type on the button', () => {
    expect(html(<Box tag="button" type="submit">x</Box>)).toMatch(/<button[^>]*type="submit"/)
  })
})

describe('Box starts from the element it renders, not from a div', () => {
  it('leaves inline elements inline', () => {
    // Stating block for everything made a converted <a> a full-width block, so
    // two links that sat side by side in a sentence stacked, and one footer grew
    // from 47px to 112px.
    for (const tag of ['a', 'span', 'em', 'strong', 'label'] as const) {
      const cls = classOf(html(<Box tag={tag}>x</Box>), tag)
      expect(cls, tag).toMatch(/_dsp-inline/)
    }
  })

  it('keeps block elements block', () => {
    for (const tag of ['p', 'section', 'h2', 'ul', 'main'] as const) {
      const cls = classOf(html(<Box tag={tag}>x</Box>), tag)
      expect(cls, tag).toMatch(/_dsp-block/)
    }
  })

  it('still lets a class decide', () => {
    const cls = classOf(html(<Box tag="a" className="flex">x</Box>), 'a')
    expect(cls).toMatch(/_dsp-flex/)
  })
})

describe('Box lays out on grid', () => {
  it('emits display:grid and a template', () => {
    // grid is the layout to reach for first: two axes stated once, instead of a
    // tree of nested flex rows. tw already spoke the whole vocabulary; only
    // gui's display TYPE refused the value, never its runtime.
    const out = html(<Box className="grid grid-cols-3 gap-4">x</Box>)
    expect(classOf(out, 'div')).toMatch(/_dsp-grid/)
    expect(out).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
  })

  it('gives a list item its marker', () => {
    // Without display:list-item a converted <li> loses its bullet, and a list
    // stops reading as a list.
    expect(html(<Box tag="li">x</Box>)).toMatch(/display:\s*list-item/)
  })
})

describe('Box: ARIA states', () => {
  it('takes an aria state in its markup spelling', () => {
    // gui types these as boolean and markup writes them as strings, so a
    // component spreading `ComponentPropsWithoutRef<'a'>` into a Box used to
    // fail on whichever aria the caller reached for.
    const out = html(
      <Box tag="a" href="#x" aria-modal="false" aria-expanded="true" aria-hidden="false">link</Box>,
    )
    expect(out).toContain('aria-modal="false"')
    expect(out).toContain('aria-expanded="true"')
  })

  it('takes the element\'s own handlers, capture phase included', () => {
    // A component forwarding `ComponentPropsWithoutRef<'a'>` into a Box hands
    // over every handler React declares, not the few named by hand.
    const props: React.ComponentPropsWithoutRef<'a'> = {
      onClickCapture: (e) => void e.currentTarget.href,
      onPointerDown: () => {},
      onAnimationEnd: () => {},
    }
    expect(html(<Box tag="a" href="#x" {...props}>link</Box>)).toContain('<a')
  })
})
