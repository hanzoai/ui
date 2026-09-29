import { describe, expect, it } from 'vitest'

import { COMPANY, LOGIN, MENUS, OPEN, TRY, at, away } from './nav'

/**
 * The tree `Masthead` draws on hanzo.ai and on every site that wears its
 * header. A path is a page on hanzo.ai; another host prefixes it with
 * `https://hanzo.ai`, and a row that names a host is used as written.
 */
const TREE = [COMPANY, ...MENUS]
const ROWS = TREE.flatMap((menu) => menu.groups.flatMap((group) => group.links))

describe('at — where a row goes from a page on another host', () => {
  it('prefixes a path with the origin', () => {
    expect(at('/about', 'https://hanzo.ai')).toBe('https://hanzo.ai/about')
    expect(at(TRY.href, 'https://hanzo.ai')).toBe('https://hanzo.ai/signup')
  })
  it('leaves a path alone on hanzo.ai itself', () => {
    expect(at('/about')).toBe('/about')
    expect(at(OPEN.href, '')).toBe('/')
  })
  it('keeps an address that names a host, and a fragment', () => {
    expect(at('https://docs.hanzo.ai', 'https://hanzo.ai')).toBe('https://docs.hanzo.ai')
    expect(at('#choices', 'https://hanzo.ai')).toBe('#choices')
  })
})

describe('the tree', () => {
  it('reads Research, Products, Solutions, Developers, Learn after the company', () => {
    expect(COMPANY.label).toBe('Company')
    expect(MENUS.map((m) => m.label)).toEqual(['Research', 'Products', 'Solutions', 'Developers', 'Learn'])
  })
  it('gives every menu a distinct id, and every row a path or an https address', () => {
    expect(new Set(TREE.map((m) => m.id)).size).toBe(TREE.length)
    for (const row of [...ROWS, ...LOGIN, TRY, OPEN]) {
      expect(row.href.startsWith('/') || (away(row.href) && row.href.startsWith('https://')), row.href).toBe(true)
    }
  })
  it('never repeats a label inside one column', () => {
    for (const menu of TREE) {
      for (const group of menu.groups) {
        const labels = group.links.map((l) => l.label)
        expect(new Set(labels).size, `${menu.label} / ${group.title}`).toBe(labels.length)
      }
    }
  })
  it('asks a stranger to Try Hanzo at the sign-up', () => {
    expect(TRY).toEqual({ label: 'Try Hanzo', href: '/signup' })
  })
})
