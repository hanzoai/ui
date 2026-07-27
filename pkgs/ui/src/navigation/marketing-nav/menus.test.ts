import { describe, expect, it } from 'vitest'

import { HANZO_MARKETING_MENUS, isMenu, type NavLink, type NavMenuSpec } from './menus'

describe('isMenu', () => {
  it('discriminates dropdowns from plain links', () => {
    expect(isMenu({ label: 'Pricing', href: '/pricing' })).toBe(false)
    expect(isMenu({ label: 'Learn', columns: [] })).toBe(true)
  })
})

describe('HANZO_MARKETING_MENUS', () => {
  const links = (): NavLink[] =>
    HANZO_MARKETING_MENUS.flatMap((i) =>
      isMenu(i) ? (i as NavMenuSpec).columns.flatMap((c) => c.links) : [i as NavLink],
    )

  it('carries the bar the five properties rendered, in order', () => {
    expect(HANZO_MARKETING_MENUS.map((i) => (isMenu(i) ? i.label : i.label))).toEqual([
      'Meet Hanzo',
      'Pricing',
      'Learn',
    ])
  })

  it('every destination is a site-relative path or an absolute URL — never a bare word', () => {
    for (const l of links()) {
      expect(l.href, l.label).toMatch(/^(\/|https?:\/\/)/)
    }
  })

  // The copies rendered off-site destinations as guarded anchors rather than
  // router links, because a client router cannot navigate off-site. Keeping the
  // flag honest is what lets the renderer make that choice from data alone.
  it('marks every absolute URL external, and no relative path', () => {
    for (const l of links()) {
      expect(Boolean(l.external), `${l.label} → ${l.href}`).toBe(l.href.startsWith('http'))
    }
  })

  it('has no duplicate destination inside a single column', () => {
    for (const item of HANZO_MARKETING_MENUS) {
      if (!isMenu(item)) continue
      for (const col of item.columns) {
        const hrefs = col.links.map((l) => l.href)
        expect(new Set(hrefs).size, `${item.label}/${col.title}`).toBe(hrefs.length)
      }
    }
  })

  it('only the featured rows carry a glyph + note', () => {
    const featured = links().filter((l) => l.glyph)
    expect(featured.map((l) => l.label)).toEqual(['Zen LM', 'Hanzo Dev'])
    for (const l of featured) expect(l.note, l.label).toBeTruthy()
  })
})
