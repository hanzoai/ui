/**
 * A stored icon name resolves the way the record kit decided: a Lucide name as
 * it is, a Tabler name through its pair, then the same-name rule, then the
 * kind's fallback. Run against the real Lucide name set, so a pair or a concept
 * that names an icon Lucide does not ship fails here, not on a page.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { CONCEPTS, FIELD_ICONS, TABLER, iconWords, resolveIcon } from './icons'

const require = createRequire(import.meta.url)
const pkg = JSON.parse(readFileSync(require.resolve('@hanzogui/lucide-icons-2/package.json'), 'utf8'))
const names = new Set(
  Object.keys(pkg.exports as Record<string, unknown>)
    .filter((k) => k.startsWith('./icons/'))
    .map((k) => k.slice('./icons/'.length)),
)

describe('the name set', () => {
  it('is Lucide’s whole set', () => {
    expect(names.size).toBeGreaterThan(1500)
    expect(names.has('Building2')).toBe(true)
  })

  it('every pair, concept and field type names an icon that exists', () => {
    const missing = [
      ...Object.values(TABLER),
      ...CONCEPTS.map((c) => c.icon),
      ...Object.values(FIELD_ICONS),
    ].filter((n) => !names.has(n))
    expect(missing).toEqual([])
    expect(Object.keys(TABLER)).toHaveLength(153)
  })
})

describe('resolveIcon', () => {
  it('a Lucide name stands as it is', () => {
    expect(resolveIcon('Building2', names)).toBe('Building2')
  })

  it('a mapped Tabler name takes its pair, by meaning', () => {
    expect(resolveIcon('IconBuildingSkyscraper', names)).toBe('Building2')
    expect(resolveIcon('IconUser', names)).toBe('User')
  })

  it('else the same-name rule: strip Icon, then 2/3, then Circle/Square moved', () => {
    expect(resolveIcon('IconAnchor', names)).toBe('Anchor')
    const moved = resolveIcon('IconCircleCheck', names)
    expect(['CircleCheck', 'CheckCircle']).toContain(moved)
  })

  it('else the kind’s fallback: an object is a Box, a view a Table, an option nothing', () => {
    expect(resolveIcon('IconNoSuchThing', names, 'object')).toBe('Box')
    expect(resolveIcon('IconNoSuchThing', names, 'view')).toBe('Table')
    expect(resolveIcon('IconNoSuchThing', names, 'option')).toBeNull()
    expect(resolveIcon(null, names, 'object')).toBe('Box')
    expect(resolveIcon('', names)).toBeNull()
  })

  it('never treats a lowercase string as a name', () => {
    expect(resolveIcon('building', names, 'other')).toBeNull()
  })
})

describe('iconWords', () => {
  it('splits the name at its capitals and adds the concepts it draws', () => {
    expect(iconWords('Building2')).toContain('building2')
    expect(iconWords('Building2')).toContain('company')
    expect(iconWords('CalendarClock')).toContain('calendar clock')
  })
})
