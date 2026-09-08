// @vitest-environment jsdom

/**
 * Pagination's a11y contract, asserted on compiled markup: the landmark, the
 * list semantics, which link carries `aria-current="page"`, and that the
 * ellipsis is hidden from the tree it decorates.
 *
 * Imports `./pagination` directly rather than the backend barrel, for the same
 * reason `accordion.test.tsx` does — a test for one component should not fail
 * because a different one's dependency moved.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './pagination'

const html = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      {node}
    </GuiProvider>,
  )

const tag = (markup: string, slot: string) =>
  markup.match(new RegExp(`<[a-z0-9]+[^>]*data-slot="${slot}"[^>]*>`))?.[0] ?? ''

const three = () => (
  <Pagination>
    <PaginationContent>
      <PaginationItem>
        <PaginationPrevious href="#" />
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#page/1">1</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#page/2" isActive>
          2
        </PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationLink href="#page/3">3</PaginationLink>
      </PaginationItem>
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
      <PaginationItem>
        <PaginationNext href="#" />
      </PaginationItem>
    </PaginationContent>
  </Pagination>
)

describe('Pagination', () => {
  it('is a navigation landmark around a real list', () => {
    const markup = html(three())

    expect(tag(markup, 'pagination')).toContain('<nav')
    expect(tag(markup, 'pagination')).toContain('aria-label="pagination"')
    expect(tag(markup, 'pagination-content')).toContain('<ul')
    // Six stops: previous, three pages, an ellipsis, next.
    expect([...markup.matchAll(/data-slot="pagination-item"/g)]).toHaveLength(6)
  })

  it('marks exactly the active page current, and no other link', () => {
    const markup = html(three())
    const links = [...markup.matchAll(/<a[^>]*data-slot="pagination-link"[^>]*>/g)].map((m) => m[0])
    // previous + three page numbers + next
    expect(links).toHaveLength(5)
    const pages = links.filter((l) => !l.includes('aria-label='))
    expect(pages).toHaveLength(3)
    const current = links.filter((l) => l.includes('aria-current="page"'))
    expect(current).toHaveLength(1)
    expect(current[0]).toContain('href="#page/2"')
    expect(current[0]).toContain('data-active="true"')
    // The other two pages carry neither marker.
    for (const l of pages.filter((l) => !l.includes('aria-current')))
      expect(l).not.toContain('data-active')
  })

  it('gives previous and next their labels, icons and hrefs', () => {
    const markup = html(three())
    const prev = tag(markup, 'pagination-link')

    expect(markup).toContain('aria-label="Go to previous page"')
    expect(markup).toContain('aria-label="Go to next page"')
    expect(markup).toContain('Previous')
    expect(markup).toContain('Next')
    expect(prev).toContain('href="#"')
  })

  it('hides the ellipsis from the accessibility tree but still names it', () => {
    const markup = html(three())
    const ellipsis = tag(markup, 'pagination-ellipsis')

    expect(ellipsis.startsWith('<span')).toBe(true)
    expect(ellipsis).toContain('aria-hidden')
    expect(markup).toContain('More pages')
  })

  it('renders a plain link with no isActive as unpressed', () => {
    const markup = html(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )
    const link = tag(markup, 'pagination-link')

    expect(link).not.toContain('aria-current')
    expect(link).not.toContain('data-active')
  })
})
