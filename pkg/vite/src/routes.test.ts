import { describe, expect, it } from 'vitest'

import { address, file, match, tree } from './routes'

const t = tree([
  'layout.tsx',
  '(en)/layout.tsx',
  '(en)/page.tsx',
  '(en)/about/page.tsx',
  '[slug]/layout.tsx',
  '[slug]/[[...post]]/page.tsx',
  'docs/[...path]/page.tsx',
  'rss.xml/route.ts',
  'opengraph-image.tsx',
  '[slug]/opengraph-image.tsx',
  'not-found.tsx',
  'robots.ts',
  'sitemap.ts',
  '_parts/page.tsx',
  'notes.md',
])

describe('tree', () => {
  it('reads groups as levels that name no segment', () => {
    const about = t.routes.find((r) => r.dir === '(en)/about')!
    expect(about.levels).toEqual(['', '(en)', '(en)/about'])
    expect(about.parts).toEqual([{ kind: 'static', value: 'about' }])
  })

  it('keeps a private folder out', () => {
    expect(t.routes.some((r) => r.dir.startsWith('_parts'))).toBe(false)
  })

  it('lends each page the nearest opengraph image', () => {
    expect(t.routes.find((r) => r.dir === '(en)')!.image).toBe('opengraph-image.tsx')
    expect(t.routes.find((r) => r.dir === '[slug]/[[...post]]')!.image).toBe('[slug]/opengraph-image.tsx')
  })

  it('finds the root files', () => {
    expect([t.missing, t.robots, t.sitemap]).toEqual(['not-found.tsx', 'robots.ts', 'sitemap.ts'])
  })

  it('refuses what it cannot render, by name', () => {
    expect(() => tree(['@modal/page.tsx'])).toThrow(/parallel route/)
    expect(() => tree(['(.)photo/page.tsx'])).toThrow(/intercepting route/)
    expect(() => tree(['x/page.tsx', 'x/route.ts'])).toThrow(/both a page and a route/)
    expect(() => tree(['(a)/x/page.tsx', '(b)/x/page.tsx'])).toThrow(/same address/)
  })
})

describe('match', () => {
  it('prefers a static segment to a parameter', () => {
    expect(match(t, '/about/')?.route.dir).toBe('(en)/about')
  })

  it('reads an optional rest as absent when nothing follows', () => {
    expect(match(t, '/candle/')).toMatchObject({ route: { dir: '[slug]/[[...post]]' }, params: { slug: 'candle', post: undefined } })
    expect(match(t, '/ar/candle/')?.params).toEqual({ slug: 'ar', post: ['candle'] })
  })

  it('requires a rest when it is not optional', () => {
    expect(match(t, '/docs/a/b')?.params).toEqual({ path: ['a', 'b'] })
    expect(match(t, '/docs')?.route.dir).toBe('[slug]/[[...post]]')
  })

  it('answers the root and a route handler', () => {
    expect(match(t, '/')?.route.dir).toBe('(en)')
    expect(match(t, '/rss.xml')?.route.handler).toBe('rss.xml/route.ts')
  })
})

describe('address and file', () => {
  const parts = t.routes.find((r) => r.dir === '[slug]/[[...post]]')!.parts
  it('writes an address with and without the trailing slash', () => {
    expect(address(parts, { slug: 'ar', post: ['x y'] }, true)).toBe('/ar/x%20y/')
    expect(address(parts, { slug: 'candle' }, false)).toBe('/candle')
    expect(address([], {}, true)).toBe('/')
  })

  it('refuses a missing parameter', () => {
    expect(() => address(parts, {}, true)).toThrow(/no value for \[slug\]/)
  })

  it('names the file a server answers the address from', () => {
    expect(file('/', true)).toBe('index.html')
    expect(file('/ar/x%20y/', true)).toBe('ar/x y/index.html')
    expect(file('/pricing', false)).toBe('pricing.html')
  })
})
