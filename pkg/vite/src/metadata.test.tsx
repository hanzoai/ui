import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { render, resolve, robotsText, sitemapText, viewport, type Metadata } from './metadata'

const html = (levels: Array<Metadata | undefined>, images: Array<Parameters<typeof resolve>[1][number]> = []) =>
  renderToStaticMarkup(<>{render(resolve(levels, images), viewport([]))}</>)

const root: Metadata = { metadataBase: new URL('https://hanzo.blog'), title: { default: 'Hanzo Blog', template: '%s - Hanzo Blog' }, description: 'Frontier AI.' }

describe('titles', () => {
  it('takes the template from a level above', () => {
    expect(html([root, undefined, undefined, { title: 'Candle' }])).toContain('<title>Candle - Hanzo Blog</title>')
  })

  it('never takes a template stated at its own level', () => {
    expect(html([root, { title: 'Hanzo Blog' }])).toContain('<title>Hanzo Blog</title>')
  })

  it('keeps the inherited default when a page states none', () => {
    expect(html([root, undefined, {}])).toContain('<title>Hanzo Blog</title>')
  })

  it('takes an absolute title as written', () => {
    expect(html([root, undefined, { title: { absolute: 'مدونة Hanzo' } }])).toContain('<title>مدونة Hanzo</title>')
  })
})

describe('openGraph and twitter', () => {
  it("lend a level's image and fill title and description from the page", () => {
    const out = html([root, {}], [{ alt: 'Hanzo Blog', type: 'image/png', url: '/opengraph-image?1', width: 1200, height: 630 }])
    expect(out).toContain('<meta property="og:title" content="Hanzo Blog"/>')
    expect(out).toContain('<meta property="og:image:alt" content="Hanzo Blog"/><meta property="og:image:type" content="image/png"/><meta property="og:image" content="https://hanzo.blog/opengraph-image?1"/>')
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image"/>')
    expect(out).toContain('<meta name="twitter:image" content="https://hanzo.blog/opengraph-image?1"/>')
  })

  it('keeps a page that states its own images', () => {
    const out = html([root, { openGraph: { images: ['/x.png'] } }], [{ url: '/opengraph-image?1' }])
    expect(out).toContain('content="https://hanzo.blog/x.png"')
    expect(out).not.toContain('opengraph-image')
  })

  it('writes an article in the order the App Router does', () => {
    const out = html([root, { openGraph: { type: 'article', title: 'T', publishedTime: '2024-08-07', tags: ['a', 'b'] } }])
    expect(out.indexOf('og:title')).toBeLessThan(out.indexOf('og:type'))
    expect(out.indexOf('og:type')).toBeLessThan(out.indexOf('article:published_time'))
    expect(out.match(/article:tag/g)).toHaveLength(2)
  })
})

describe('the rest of the head', () => {
  it('resolves canonical and alternates, and leaves icons as stated', () => {
    const out = html([root, { alternates: { canonical: '/a/', languages: { ar: '/ar/a/' } }, icons: { icon: '/favicon.svg' }, manifest: '/site.webmanifest' }])
    expect(out).toContain('<link rel="canonical" href="https://hanzo.blog/a/"/>')
    expect(out).toContain('<link rel="alternate" hrefLang="ar" href="https://hanzo.blog/ar/a/"/>')
    expect(out).toContain('<link rel="icon" href="/favicon.svg"/>')
    expect(out).toContain('<link rel="manifest" href="/site.webmanifest"/>')
  })

  it('spells robots the App Router way', () => {
    const out = html([root, { robots: { index: true, follow: true, googleBot: { index: true, 'max-image-preview': 'large', 'max-snippet': -1 } } }])
    expect(out).toContain('<meta name="robots" content="index, follow"/>')
    expect(out).toContain('<meta name="googlebot" content="index, max-image-preview:large, max-snippet:-1"/>')
  })

  it('refuses a key it does not render', () => {
    expect(() => resolve([{ appleWebApp: true } as unknown as Metadata], [])).toThrow(/metadata.appleWebApp/)
  })
})

describe('robots.txt and sitemap.xml', () => {
  it('writes robots.txt', () => {
    expect(robotsText({ rules: [{ userAgent: '*', allow: '/' }], host: 'https://hanzo.blog', sitemap: 'https://hanzo.blog/sitemap.xml' })).toBe(
      'User-Agent: *\nAllow: /\n\nHost: https://hanzo.blog\nSitemap: https://hanzo.blog/sitemap.xml\n',
    )
  })

  it('writes a sitemap with alternates only when it has them', () => {
    const plain = sitemapText([{ url: 'https://x/', priority: 1 }])
    expect(plain).not.toContain('xmlns:xhtml')
    const xml = sitemapText([{ url: 'https://x/', lastModified: new Date('2026-01-01'), changeFrequency: 'daily', alternates: { languages: { ar: 'https://x/ar/' } } }])
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="ar" href="https://x/ar/" />\n<lastmod>2026-01-01T00:00:00.000Z</lastmod>')
  })
})
