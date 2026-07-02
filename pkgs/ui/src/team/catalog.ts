/**
 * @hanzo/ui/team — app-scoped team-role catalog (client mirror).
 *
 * This is the EXACT mirror of the server-side policy in Hanzo IAM
 * (github.com/hanzoai/iam, package `teamrole`). The keys, ranks, and the
 * effective-rank / assignable-keys functions are kept identical so the role
 * picker only offers roles the server will actually accept.
 *
 * IMPORTANT: this mirror is UX only. The IAM server (`teamrole.CheckAssignment`,
 * wired into every /v1/iam add/update/delete-role and add-invitation) is the
 * sole authority. Never treat a client-side check as a security boundary — a
 * hostile client can call the API directly; the server denies regardless.
 */

export type TeamApp = 'billing' | 'console' | 'org'
export type TeamTier = 'viewer' | 'admin' | 'owner'

export type RoleKey =
  | 'billing:viewer'
  | 'billing:admin'
  | 'console:viewer'
  | 'console:admin'
  | 'console:owner'
  | 'org:owner'

export interface CatalogRole {
  key: RoleKey
  app: TeamApp
  tier: TeamTier
  /** Strict order: viewer(10) < admin(20) < console:owner(30) < org:owner(100). */
  rank: number
  displayName: string
  description: string
}

/** Minimum effective rank to manage team membership in an app. */
export const RANK_ADMIN = 20

/** Canonical catalog, ordered by rank. Mirrors iam/teamrole/catalog.go. */
export const TEAM_CATALOG: readonly CatalogRole[] = [
  { key: 'billing:viewer', app: 'billing', tier: 'viewer', rank: 10, displayName: 'Billing Viewer', description: 'Read-only access to billing: invoices, usage, and team members.' },
  { key: 'billing:admin', app: 'billing', tier: 'admin', rank: 20, displayName: 'Billing Admin', description: 'Manage billing: payment methods, plans, spend limits, and the billing team.' },
  { key: 'console:viewer', app: 'console', tier: 'viewer', rank: 10, displayName: 'Console Viewer', description: 'Read-only access to console projects and resources.' },
  { key: 'console:admin', app: 'console', tier: 'admin', rank: 20, displayName: 'Console Admin', description: 'Manage console resources and the console team.' },
  { key: 'console:owner', app: 'console', tier: 'owner', rank: 30, displayName: 'Console Owner', description: 'Full ownership of the console surface, including owner assignment.' },
  { key: 'org:owner', app: 'org', tier: 'owner', rank: 100, displayName: 'Organization Owner', description: 'Full ownership of the organization: every app, billing, team, and ownership transfer.' },
] as const

const BY_KEY: ReadonlyMap<string, CatalogRole> = new Map(TEAM_CATALOG.map((r) => [r.key, r]))

/** Look up a catalog role by key, or undefined if not a managed role. */
export function lookupRole(key: string): CatalogRole | undefined {
  return BY_KEY.get(key)
}

/** Whether a role name is a managed catalog role. */
export function isManagedRole(key: string): boolean {
  return BY_KEY.has(key)
}

/** Catalog roles for one app, ordered by rank ascending. */
export function appTiers(app: TeamApp): CatalogRole[] {
  return TEAM_CATALOG.filter((r) => r.app === app)
}

/**
 * Caller's maximum authority rank for a target app. An org:owner is
 * authoritative over every app (short-circuits to 100); otherwise the highest
 * rank among the caller's roles in that app. Unknown/forged keys are ignored.
 * Mirrors teamrole.EffectiveRank.
 */
export function effectiveRank(callerKeys: readonly string[], targetApp: TeamApp): number {
  let max = 0
  for (const k of callerKeys) {
    const role = BY_KEY.get(k)
    if (!role) continue
    if (role.app === 'org' && role.tier === 'owner') return role.rank
    if (role.app === targetApp && role.rank > max) max = role.rank
  }
  return max
}

/**
 * Whether a caller could assign targetKey within their own org. Mirrors the
 * org-equal branch of teamrole.CheckAssignment: superuser OR org-admin → always
 * (an org admin owns their org's team); else need admin+ authority in the
 * target app AND target rank ≤ caller's effective rank. (Cross-org is
 * impossible in the UI — the component only ever operates on the caller's own
 * org — so it is not modeled here; the server still enforces it.)
 */
export function canAssign(
  callerKeys: readonly string[],
  targetKey: string,
  isGlobalAdmin = false,
  isOrgAdmin = false,
): boolean {
  const target = BY_KEY.get(targetKey)
  if (!target) return false
  if (isGlobalAdmin || isOrgAdmin) return true
  const eff = effectiveRank(callerKeys, target.app)
  if (eff < RANK_ADMIN) return false
  return target.rank <= eff
}

/** The catalog keys a caller may assign, in canonical order. Mirrors AssignableKeys. */
export function assignableKeys(callerKeys: readonly string[], isGlobalAdmin = false, isOrgAdmin = false): RoleKey[] {
  return TEAM_CATALOG.filter((r) => canAssign(callerKeys, r.key, isGlobalAdmin, isOrgAdmin)).map((r) => r.key)
}

/**
 * The subset of assignable keys that belong to a given app (plus org:owner,
 * which an org owner assigns from any surface). This is what the role picker on
 * the billing/console surface renders.
 */
export function assignableKeysForApp(
  callerKeys: readonly string[],
  app: TeamApp,
  isGlobalAdmin = false,
  isOrgAdmin = false,
): RoleKey[] {
  return assignableKeys(callerKeys, isGlobalAdmin, isOrgAdmin).filter((k) => {
    const r = BY_KEY.get(k)!
    return r.app === app || r.app === 'org'
  })
}

/** Whether the caller can manage the team on a given app surface at all. */
export function canManageApp(
  callerKeys: readonly string[],
  app: TeamApp,
  isGlobalAdmin = false,
  isOrgAdmin = false,
): boolean {
  return isGlobalAdmin || isOrgAdmin || effectiveRank(callerKeys, app) >= RANK_ADMIN
}
