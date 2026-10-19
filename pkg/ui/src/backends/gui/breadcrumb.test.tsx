// @vitest-environment jsdom

/**
 * Breadcrumb on gui props: a real nav around a real ordered list, separators
 * hidden from assistive tech, the page you are on marked current and allowed to
 * shrink, and no utility class strings left in the markup.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GuiProvider } from '@hanzo/gui'

import config from '../../gui-config'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './breadcrumb'

const html = () =>
  renderToStaticMarkup(
    <GuiProvider config={config} defaultTheme="dark">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/companies">Companies</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Acme</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </GuiProvider>,
  ).replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')

describe('Breadcrumb', () => {
  it('is a nav around an ordered list of items', () => {
    const markup = html()
    expect(markup).toMatch(/<nav[^>]*aria-label="Breadcrumb"/)
    expect(markup).toMatch(/<ol[^>]*data-slot="breadcrumb-list"/)
    expect(markup.match(/<li[^>]*data-slot="breadcrumb-item"/g)).toHaveLength(2)
  })

  it('a step with an address is a link; the page is current and the one that shrinks', () => {
    const markup = html()
    expect(markup).toMatch(/<a[^>]*href="\/companies"/)
    const page = markup.match(/<[a-z]+[^>]*data-slot="breadcrumb-page"[^>]*>/)![0]
    expect(page).toContain('aria-current="page"')
    expect(page).toMatch(/_col-ink/)
    expect(page).toMatch(/_shrink-1/)
  })

  it('a "/" in an 8px slot, hidden from assistive tech', () => {
    const sep = html().match(/<li[^>]*data-slot="breadcrumb-separator"[^>]*>[\s\S]*?<\/li>/)![0]
    expect(sep).toContain('aria-hidden="true"')
    expect(sep).toMatch(/_width-8px/)
    expect(sep).toContain('>/<')
  })

  it('carries no utility class strings', () => {
    expect(html()).not.toMatch(/text-muted-foreground|gap-1\.5|text-sm|grid-flow-col/)
  })
})
