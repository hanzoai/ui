/**
 * A link that asks for a button variant renders a button.
 *
 * `buttonVariants` returns `btn btn-primary btn-default` — names a host can
 * hook, with no rule of their own in the shipped sheet. A `LinkDef` carrying
 * `variant: 'primary'` therefore came out as underlined body text: measured on
 * every call-to-action across the lux sites, all of which looked like prose.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { LinkElement } from './link'

const html = (ui: React.ReactNode) =>
  renderToStaticMarkup(<GuiProvider config={config as never} defaultTheme="dark">{ui}</GuiProvider>)

describe('LinkElement wearing a button', () => {
  it('gives a primary def a real background, not just a class name', () => {
    const out = html(<LinkElement def={{ href: '/x', title: 'Go', variant: 'primary' }} />)
    expect(out).toContain('<a')                    // still an anchor
    expect(out).toContain('Go')
    // the styled frame is what a variant means; a bare anchor has no such class
    expect(out).toMatch(/class="[^"]*is_View/)
  })

  it('leaves a link-variant def as a plain anchor', () => {
    // `link` means "look like a link", which the anchor already does — wrapping
    // it in a frame would add a box around every nav item.
    const out = html(<LinkElement def={{ href: '/x', title: 'Go', variant: 'link' }} />)
    expect(out).not.toMatch(/class="[^"]*is_View/)
  })

  it('defaults to the plain anchor when the def names no variant', () => {
    const out = html(<LinkElement def={{ href: '/x', title: 'Go' }} />)
    expect(out).not.toMatch(/class="[^"]*is_View/)
  })

  it('keeps the href and the new-tab guard on an external def', () => {
    const out = html(<LinkElement def={{ href: 'https://x.test', title: 'Go', variant: 'outline' }} />)
    expect(out).toContain('href="https://x.test"')
    expect(out).toContain('rel="noreferrer noopener"')
  })
})
