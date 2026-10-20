import { describe, expect, it } from 'vitest'

import { AGENCY, COMPANY, FOOT, FOOT_LINE, HANZO, LOGIN, MENUS, OPEN, TRY, at, away, footer, leaves } from './nav'

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
    expect(at(TRY.href, 'https://hanzo.ai')).toBe('https://hanzo.ai/onboarding')
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
  it('asks a stranger to Try Hanzo at the onboarding', () => {
    expect(TRY).toEqual({ label: 'Try Hanzo', href: '/onboarding' })
  })
})

describe('here — a row that names the page\'s own host', () => {
  it('is a page of that site, and does not leave it', () => {
    expect(at(AGENCY, HANZO, AGENCY)).toBe('/')
    expect(at(`${AGENCY}/terms`, HANZO, AGENCY)).toBe('/terms')
    expect(leaves(AGENCY, AGENCY)).toBe(false)
    expect(leaves(AGENCY)).toBe(true)
    expect(leaves('/about', AGENCY)).toBe(false)
  })
  it('leaves every other host alone', () => {
    expect(at('https://hanzo.agency.example', HANZO, AGENCY)).toBe('https://hanzo.agency.example')
  })
})

describe('footer — the six doors and the legal line', () => {
  it('reads the header\'s menus, in order, then Company', () => {
    expect(FOOT.map((m) => m.label)).toEqual(['Research', 'Products', 'Solutions', 'Developers', 'Learn', 'Company'])
  })
  it('prefixes paths for another host and marks only what leaves', () => {
    const { columns, legal } = footer(HANZO, AGENCY)
    const solutions = columns.find((c) => c.title === 'Solutions')!
    expect(solutions.href).toBe(`${HANZO}/solutions`)
    expect(solutions.out).toBe(false)
    expect(solutions.links.find((l) => l.label === 'Agency')).toEqual({ label: 'Agency', href: '/', out: false })
    expect(columns.find((c) => c.title === 'Developers')!.out).toBe(true)
    expect(legal.map((l) => l.label)).toEqual(FOOT_LINE.map((l) => l.label))
  })
})
