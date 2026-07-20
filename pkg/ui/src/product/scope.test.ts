import { describe, expect, it } from 'vitest'

import { filterOrgs, orgScope } from './scope'

/** In-memory Storage double. */
function memory(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const m = new Map<string, string>()
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  }
}

function harness() {
  const calls: string[] = []
  const scope = orgScope({
    brandOrg: 'hanzo',
    storage: memory(),
    navigate: (path) => calls.push(`nav:${path}`),
    reload: () => calls.push('reload'),
  })
  return { scope, calls }
}

describe('orgScope', () => {
  it('defaults to the brand org, un-selected', () => {
    const { scope } = harness()
    expect(scope.currentOrg()).toBe('hanzo')
    expect(scope.isScopedAway()).toBe(false)
    expect(scope.hasSelectedOrg()).toBe(false)
  })

  it('setCurrentOrg persists; the brand org clears the override', () => {
    const { scope } = harness()
    scope.setCurrentOrg('acme')
    expect(scope.currentOrg()).toBe('acme')
    expect(scope.isScopedAway()).toBe(true)
    scope.setCurrentOrg('hanzo')
    expect(scope.currentOrg()).toBe('hanzo')
    expect(scope.isScopedAway()).toBe(false)
  })

  it('enterOrg selects + scopes + navigates home', () => {
    const { scope, calls } = harness()
    scope.enterOrg('acme')
    expect(scope.currentOrg()).toBe('acme')
    expect(scope.hasSelectedOrg()).toBe(true)
    expect(calls).toEqual(['nav:/'])
  })

  it('leaveOrg de-selects, resets to the brand org, navigates home', () => {
    const { scope, calls } = harness()
    scope.enterOrg('acme')
    scope.leaveOrg()
    expect(scope.currentOrg()).toBe('hanzo')
    expect(scope.hasSelectedOrg()).toBe(false)
    expect(calls).toEqual(['nav:/', 'nav:/'])
  })

  it('switchOrg persists, keeps the selection, reloads; same org is a no-op', () => {
    const { scope, calls } = harness()
    scope.enterOrg('acme')
    scope.switchOrg('zoo')
    expect(scope.currentOrg()).toBe('zoo')
    expect(scope.hasSelectedOrg()).toBe(true)
    expect(calls).toEqual(['nav:/', 'reload'])
    scope.switchOrg('zoo')
    expect(calls).toEqual(['nav:/', 'reload'])
  })

  it('two scopes with different keys never collide', () => {
    const store = memory()
    const a = orgScope({ brandOrg: 'hanzo', key: 'a', storage: store })
    const b = orgScope({ brandOrg: 'hanzo', key: 'b', storage: store })
    a.setCurrentOrg('acme')
    expect(b.currentOrg()).toBe('hanzo')
  })
})

describe('filterOrgs', () => {
  const orgs = [
    { name: 'acme', displayName: 'Acme Corp' },
    { name: 'zoo', displayName: 'Zoo Labs' },
  ]
  it('matches name and displayName, case-insensitive; blank returns all', () => {
    expect(filterOrgs(orgs, '')).toHaveLength(2)
    expect(filterOrgs(orgs, 'ACME')).toEqual([orgs[0]])
    expect(filterOrgs(orgs, 'labs')).toEqual([orgs[1]])
    expect(filterOrgs(orgs, 'nope')).toEqual([])
  })
})
