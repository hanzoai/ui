/**
 * orgScope — the active-organization contract every Hanzo surface shares
 * (hoisted from the console; see hanzoai/ui#36).
 *
 * Brand identity (which IAM you log into, the wordmark + logo) is fixed per
 * host; the DATA scope — which org's identity, secrets and resources the app
 * acts on — is orthogonal. This module owns only that switch. Every
 * tenant-scoped call reads `currentOrg()` and stamps it as `X-Org-Id`.
 *
 * Two-level model: the org VALUE (which org) and the SELECTION (has one been
 * chosen yet) are orthogonal. A fresh login is org-LESS: `hasSelectedOrg()` is
 * false so the host can show its org picker even for a one-org user. Entering
 * (`enterOrg`) sets value + flag and navigates home; leaving (`leaveOrg`)
 * clears the flag back to the picker; the in-shell quick switch (`switchOrg`)
 * persists and reloads so every module refetches under the new `X-Org-Id`.
 *
 * Host-agnostic: storage + navigation are injected (browser defaults), so the
 * same contract runs in Next, Vite, Svelte or a test.
 */

export type Org = { name: string; displayName?: string; logo?: string }

export type OrgScopeConfig = {
  /** The brand's own org — the default scope (e.g. `config.iamOrgName`). */
  brandOrg: string
  /** Storage key namespace — ONE per surface. Default `'hanzo.org'`. */
  key?: string
  /** Storage — defaults to `window.localStorage`, null-safe on SSR/blocked. */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
  /** Navigate to a path (enter/leave land on home). Default `location.assign`. */
  navigate?: (path: string) => void
  /** Hard reload (quick-switch refetches everything). Default `location.reload`. */
  reload?: () => void
}

export type OrgScope = {
  /** The org the surface is currently scoped to (default: the brand org). */
  currentOrg(): string
  /** Switch the active scope. Passing the brand org clears the override. */
  setCurrentOrg(org: string): void
  /** True when scoped to a non-default (switched) org. */
  isScopedAway(): boolean
  /** True once an org has been explicitly ENTERED (picker → shell). */
  hasSelectedOrg(): boolean
  /** Enter an org from the picker: scope + select + navigate home. */
  enterOrg(org: string): void
  /** Leave the org (back to the picker): de-select + reset + navigate home. */
  leaveOrg(): void
  /** In-shell quick switch: persist + keep selection + reload. Same org: no-op. */
  switchOrg(org: string): void
}

function browserStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function orgScope(config: OrgScopeConfig): OrgScope {
  const key = config.key ?? 'hanzo.org'
  const selectedKey = `${key}.selected`
  const store = () => config.storage ?? browserStorage()
  const read = (k: string): string | null => {
    try {
      return store()?.getItem(k) ?? null
    } catch {
      return null
    }
  }
  const write = (k: string, v: string | null): void => {
    try {
      if (v === null) store()?.removeItem(k)
      else store()?.setItem(k, v)
    } catch {
      // Storage blocked — the scope simply stays at the brand org.
    }
  }
  const goHome = () => {
    if (config.navigate) return config.navigate('/')
    if (typeof window !== 'undefined') window.location.assign('/')
  }
  const doReload = () => {
    if (config.reload) return config.reload()
    if (typeof window !== 'undefined') window.location.reload()
  }

  const scope: OrgScope = {
    currentOrg: () => read(key) || config.brandOrg,
    setCurrentOrg: (org) => write(key, !org || org === config.brandOrg ? null : org),
    isScopedAway: () => scope.currentOrg() !== config.brandOrg,
    hasSelectedOrg: () => read(selectedKey) === '1',
    enterOrg: (org) => {
      if (!org) return
      scope.setCurrentOrg(org)
      write(selectedKey, '1')
      goHome()
    },
    leaveOrg: () => {
      write(selectedKey, null)
      scope.setCurrentOrg(config.brandOrg)
      goHome()
    },
    switchOrg: (org) => {
      if (!org || org === scope.currentOrg()) return
      scope.setCurrentOrg(org)
      write(selectedKey, '1')
      doReload()
    },
  }
  return scope
}

/** Case-insensitive filter over org name + display name (the switcher search). */
export function filterOrgs<T extends Org>(orgs: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return orgs
  return orgs.filter(
    (o) => o.name.toLowerCase().includes(q) || (o.displayName ?? '').toLowerCase().includes(q),
  )
}
