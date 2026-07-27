/**
 * @hanzo/ui/team
 *
 * The ONE shared, IAM-powered team/roles management surface. Reused verbatim by
 * billing.hanzo.ai and console.hanzo.ai. App-scoped roles, invitations, and
 * role changes — all over the canonical /v1/iam surface, enforced server-side
 * by Hanzo IAM (package `teamrole`).
 */

export { TeamManagement } from './team-management'
export type { TeamManagementProps } from './team-management'

export { TeamClient, TeamError } from './client'
export type { TeamMember, TeamClientOptions } from './client'

export {
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
} from './catalog'
export type { TeamApp, TeamTier, RoleKey, CatalogRole } from './catalog'
