import { describe, it, expect } from 'vitest'
import {
  TEAM_CATALOG,
  RANK_ADMIN,
  lookupRole,
  isManagedRole,
  appTiers,
  effectiveRank,
  canAssign,
  assignableKeys,
  assignableKeysForApp,
  canManageApp,
} from '../catalog'

// These assertions MIRROR iam/teamrole/guard_test.go. If the two ever drift the
// role picker would offer roles the server rejects (or hide roles it accepts),
// so keeping them identical is a correctness contract, not decoration.

describe('catalog integrity', () => {
  it('matches the CTO-specified roles and ranks', () => {
    const spec: Record<string, { app: string; tier: string; rank: number }> = {
      'billing:viewer': { app: 'billing', tier: 'viewer', rank: 10 },
      'billing:admin': { app: 'billing', tier: 'admin', rank: 20 },
      'console:viewer': { app: 'console', tier: 'viewer', rank: 10 },
      'console:admin': { app: 'console', tier: 'admin', rank: 20 },
      'console:owner': { app: 'console', tier: 'owner', rank: 30 },
      'org:owner': { app: 'org', tier: 'owner', rank: 100 },
    }
    expect(TEAM_CATALOG.length).toBe(Object.keys(spec).length)
    for (const r of TEAM_CATALOG) {
      expect(spec[r.key]).toBeDefined()
      expect(r.app).toBe(spec[r.key].app)
      expect(r.tier).toBe(spec[r.key].tier)
      expect(r.rank).toBe(spec[r.key].rank)
      expect(r.displayName.length).toBeGreaterThan(0)
    }
  })

  it('org:owner is unreachable by accumulating app-admin ranks', () => {
    const orgOwner = lookupRole('org:owner')!.rank
    const billingAdmin = lookupRole('billing:admin')!.rank
    const consoleAdmin = lookupRole('console:admin')!.rank
    expect(orgOwner).toBeGreaterThan(billingAdmin + consoleAdmin)
  })

  it('lookup + isManagedRole reject unknown keys', () => {
    expect(isManagedRole('billing:admin')).toBe(true)
    expect(isManagedRole('console-admin')).toBe(false) // hyphen, not canonical
    expect(lookupRole('billing:supergod')).toBeUndefined()
  })

  it('appTiers returns the right tiers per app, ordered by rank', () => {
    expect(appTiers('billing').map((r) => r.key)).toEqual(['billing:viewer', 'billing:admin'])
    expect(appTiers('console').map((r) => r.key)).toEqual(['console:viewer', 'console:admin', 'console:owner'])
  })
})

describe('effectiveRank (mirror of teamrole.EffectiveRank)', () => {
  const cases: Array<[string, string[], 'billing' | 'console', number]> = [
    ['no roles', [], 'billing', 0],
    ['billing admin in billing', ['billing:admin'], 'billing', 20],
    ['billing admin has ZERO in console', ['billing:admin'], 'console', 0],
    ['console owner in console', ['console:owner'], 'console', 30],
    ['org owner dominates billing', ['org:owner'], 'billing', 100],
    ['org owner dominates console', ['org:owner'], 'console', 100],
    ['highest of several in-app', ['billing:viewer', 'billing:admin'], 'billing', 20],
    ['forged key ignored', ['billing:root', 'nope'], 'billing', 0],
  ]
  for (const [name, keys, app, want] of cases) {
    it(name, () => expect(effectiveRank(keys, app)).toBe(want))
  }
  it('RANK_ADMIN is 20', () => expect(RANK_ADMIN).toBe(20))
})

describe('canAssign — privilege-escalation guard mirror', () => {
  it('billing admin can grant billing viewer/admin (delegation)', () => {
    expect(canAssign(['billing:admin'], 'billing:viewer')).toBe(true)
    expect(canAssign(['billing:admin'], 'billing:admin')).toBe(true)
  })
  it('billing admin CANNOT grant org:owner (vertical escalation)', () => {
    expect(canAssign(['billing:admin'], 'org:owner')).toBe(false)
  })
  it('console admin CANNOT grant console:owner (rank ceiling)', () => {
    expect(canAssign(['console:admin'], 'console:owner')).toBe(false)
  })
  it('billing admin CANNOT grant console:admin (lateral / cross-app)', () => {
    expect(canAssign(['billing:admin'], 'console:admin')).toBe(false)
  })
  it('viewer can grant nothing', () => {
    expect(canAssign(['billing:viewer'], 'billing:viewer')).toBe(false)
  })
  it('org owner grants anything; superuser grants anything', () => {
    expect(canAssign(['org:owner'], 'org:owner')).toBe(true)
    expect(canAssign(['org:owner'], 'console:owner')).toBe(true)
    expect(canAssign([], 'org:owner', true)).toBe(true)
  })
  it('forged non-catalog keys confer nothing', () => {
    expect(canAssign(['org:superadmin', 'billing:root'], 'billing:viewer')).toBe(false)
  })
})

describe('assignableKeys / assignableKeysForApp / canManageApp', () => {
  it('billing admin assigns only billing tiers up to admin', () => {
    expect(assignableKeys(['billing:admin'])).toEqual(['billing:viewer', 'billing:admin'])
  })
  it('org owner assigns everything', () => {
    expect(assignableKeys(['org:owner'])).toEqual([
      'billing:viewer',
      'billing:admin',
      'console:viewer',
      'console:admin',
      'console:owner',
      'org:owner',
    ])
  })
  it('assignableKeysForApp filters to the surface (plus org owner)', () => {
    // An org owner on the billing surface sees billing tiers + org:owner.
    expect(assignableKeysForApp(['org:owner'], 'billing')).toEqual([
      'billing:viewer',
      'billing:admin',
      'org:owner',
    ])
    // A billing admin on the billing surface sees only billing tiers.
    expect(assignableKeysForApp(['billing:admin'], 'billing')).toEqual(['billing:viewer', 'billing:admin'])
    // A billing admin on the console surface can assign nothing.
    expect(assignableKeysForApp(['billing:admin'], 'console')).toEqual([])
  })
  it('canManageApp requires admin+ in that app', () => {
    expect(canManageApp(['billing:viewer'], 'billing')).toBe(false)
    expect(canManageApp(['billing:admin'], 'billing')).toBe(true)
    expect(canManageApp(['billing:admin'], 'console')).toBe(false)
    expect(canManageApp(['org:owner'], 'console')).toBe(true)
    expect(canManageApp([], 'billing', true)).toBe(true) // superuser
  })
})
