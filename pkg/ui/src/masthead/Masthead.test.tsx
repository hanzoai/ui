// @vitest-environment jsdom

/**
 * The bar as another host draws it: the same rows, each going to hanzo.ai. A
 * row keeps its look — ↗ and a new tab only for an address that leaves
 * hanzo.ai — so the header reads the same on every site that wears it.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { Masthead, Row } from './Masthead'
import { DOCS, TRY } from './nav'

describe('Masthead', () => {
  it('names the place, links it home, and sends Try Hanzo to hanzo.ai', () => {
    const html = renderToStaticMarkup(<Masthead label="Hanzo Blog" origin="https://hanzo.ai" />)
    expect(html).toContain('aria-label="Hanzo Blog home"')
    expect(html).toContain('>Hanzo Blog<')
    expect(html).toContain(`href="https://hanzo.ai${TRY.href}"`)
    expect(html).toContain('>Try Hanzo<')
    // Five menus after the company, then search and Log in.
    for (const label of ['Research', 'Products', 'Solutions', 'Developers', 'Learn', 'Log in']) expect(html).toContain(`${label}<svg`)
    expect(html).toContain('aria-label="Search Hanzo or ask AI"')
  })

  it('draws hanzo.ai itself with paths', () => {
    const html = renderToStaticMarkup(<Masthead />)
    expect(html).toContain('aria-label="Hanzo AI home"')
    expect(html).toContain(`href="${TRY.href}"`)
    expect(html).toContain('class="hz-masthead"')
  })

  it('offers Open Hanzo to a signed-in reader instead of Log in', () => {
    const html = renderToStaticMarkup(<Masthead origin="https://hanzo.ai" person={{ name: 'Ada' }} />)
    expect(html).toContain('>Open Hanzo<')
    expect(html).not.toContain('>Log in<')
  })
})

describe('Row', () => {
  it('prefixes a path, and opens a new tab only for another host', () => {
    const page = renderToStaticMarkup(<Row link={{ label: 'About Us', href: '/about' }} origin="https://hanzo.ai" />)
    expect(page).toBe('<a href="https://hanzo.ai/about">About Us</a>')
    const docs = renderToStaticMarkup(<Row link={{ label: 'Documentation', href: DOCS }} origin="https://hanzo.ai" />)
    expect(docs).toContain(`href="${DOCS}" target="_blank" rel="noreferrer"`)
    expect(docs).toContain('class="hz-out"')
  })
})
