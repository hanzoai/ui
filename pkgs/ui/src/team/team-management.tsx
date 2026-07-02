'use client'

/**
 * @hanzo/ui/team — <TeamManagement>: the ONE shared team/roles surface.
 *
 * Mounted on billing.hanzo.ai (app="billing") and console.hanzo.ai
 * (app="console") — same component, same IAM wiring. Members + invite (email →
 * IAM invitation) + app-scoped role picker + change-role + remove. Every write
 * goes through the guarded /v1/iam surface; the server enforces app-scope,
 * rank, and org isolation. The role picker only offers roles the caller may
 * assign (UX mirror of the server guard).
 */

import * as React from 'react'
import type { RoleKey, TeamApp } from './catalog'
import { assignableKeysForApp, canManageApp, lookupRole } from './catalog'
import { TeamClient, type TeamClientOptions, type TeamMember } from './client'

export interface TeamManagementProps {
  /** Which surface this is mounted on. Determines the roles shown/enforced. */
  app: TeamApp
  /** Caller's org (from the session). All operations are scoped to it. */
  org: string
  /** Catalog role keys the caller holds — gates the UI (server re-checks). */
  currentUserRoles: string[]
  /** Platform superuser — unlocks all roles (server still authoritative). */
  isGlobalAdmin?: boolean
  /** Pre-built client (tests inject a mock). Else built from the fields below. */
  client?: TeamClient
  /** API origin. Default '' → same-origin `/v1/iam`. */
  apiBase?: string
  /** Returns the caller's IAM bearer token. */
  getToken?: TeamClientOptions['getToken']
  /** Reported on any load/mutation failure. */
  onError?: (err: Error) => void
  /** Optional heading override. */
  title?: string
}

function roleBadgeClass(roleKey: RoleKey): string {
  const tier = lookupRole(roleKey)?.tier
  switch (tier) {
    case 'owner':
      return 'bg-brand/20 text-brand'
    case 'admin':
      return 'bg-amber-500/20 text-amber-400'
    default:
      return 'bg-text-dim/20 text-text-muted'
  }
}

const INPUT_CLASS =
  'rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text outline-none transition focus:border-brand'

export function TeamManagement({
  app,
  org,
  currentUserRoles,
  isGlobalAdmin = false,
  client,
  apiBase,
  getToken,
  onError,
  title,
}: TeamManagementProps) {
  // Build the client only when we have an org (a signed-in caller). Without one
  // we render a fail-safe prompt rather than throwing or fetching.
  const teamClient = React.useMemo(
    () => client ?? (org ? new TeamClient({ org, apiBase, getToken }) : null),
    [client, org, apiBase, getToken],
  )

  const canManage = canManageApp(currentUserRoles, app, isGlobalAdmin)
  const assignable = React.useMemo(
    () => assignableKeysForApp(currentUserRoles, app, isGlobalAdmin),
    [currentUserRoles, app, isGlobalAdmin],
  )

  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState<RoleKey | ''>(assignable[0] ?? '')
  const [inviting, setInviting] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const report = React.useCallback(
    (e: unknown) => {
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err.message)
      onError?.(err)
    },
    [onError],
  )

  const refresh = React.useCallback(async () => {
    if (!teamClient) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setMembers(await teamClient.listMembers(app))
    } catch (e) {
      report(e)
    } finally {
      setLoading(false)
    }
  }, [teamClient, app, report])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  React.useEffect(() => {
    if (!inviteRole && assignable.length) setInviteRole(assignable[0])
  }, [assignable, inviteRole])

  const handleInvite = React.useCallback(async () => {
    if (!teamClient || !inviteEmail.includes('@') || !inviteRole) return
    setInviting(true)
    setError(null)
    try {
      await teamClient.invite(app, inviteEmail.trim(), inviteRole)
      setInviteEmail('')
      await refresh()
    } catch (e) {
      report(e)
    } finally {
      setInviting(false)
    }
  }, [inviteEmail, inviteRole, teamClient, app, refresh, report])

  const handleChangeRole = React.useCallback(
    async (memberId: string, roleKey: RoleKey) => {
      if (!teamClient) return
      setBusyId(memberId)
      setError(null)
      try {
        await teamClient.changeRole(app, memberId, roleKey)
        await refresh()
      } catch (e) {
        report(e)
      } finally {
        setBusyId(null)
      }
    },
    [teamClient, app, refresh, report],
  )

  const handleRemove = React.useCallback(
    async (memberId: string) => {
      if (!teamClient) return
      setBusyId(memberId)
      setError(null)
      try {
        await teamClient.remove(app, memberId)
        await refresh()
      } catch (e) {
        report(e)
      } finally {
        setBusyId(null)
      }
    },
    [teamClient, app, refresh, report],
  )

  return (
    <div className="space-y-4" data-testid="team-management">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-semibold text-text">{title ?? 'Team members'}</h3>
          <p className="text-sm text-text-muted">
            {canManage
              ? 'Invite teammates and manage their access to this surface.'
              : 'View who has access to this surface.'}
          </p>
        </div>

        {error && (
          <div className="border-b border-border bg-rose-500/10 p-3 text-sm text-rose-400" role="alert">
            {error}
          </div>
        )}

        {/* Invite — only when the caller can manage AND has assignable roles */}
        {canManage && assignable.length > 0 && (
          <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="team-invite-email">
                Email address
              </label>
              <input
                id="team-invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className={`${INPUT_CLASS} w-full`}
              />
            </div>
            <div className="w-44">
              <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="team-invite-role">
                Role
              </label>
              <select
                id="team-invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as RoleKey)}
                className={`${INPUT_CLASS} w-full`}
              >
                {assignable.map((key) => (
                  <option key={key} value={key}>
                    {lookupRole(key)?.displayName ?? key}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!inviteEmail.includes('@') || !inviteRole || inviting}
              onClick={handleInvite}
              className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inviting ? 'Inviting…' : 'Invite'}
            </button>
          </div>
        )}

        {/* Members */}
        <div className="divide-y divide-border">
          {!teamClient ? (
            <div className="p-6 text-sm text-text-muted">Sign in to manage your team.</div>
          ) : loading ? (
            <div className="p-6 text-sm text-text-muted">Loading team…</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-sm text-text-muted">No members yet.</div>
          ) : (
            members.map((member) => {
              const isBusy = busyId === member.id
              // A member may be shown a role picker only for roles the caller
              // can assign; org owners are not demotable from an app surface.
              const editable = canManage && lookupRole(member.roleKey)?.app !== 'org'
              return (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-bold text-brand">
                      {(member.name || member.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{member.name || member.email}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        {member.email && <span>{member.email}</span>}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(member.roleKey)}`}
                        >
                          {lookupRole(member.roleKey)?.displayName ?? member.roleKey}
                        </span>
                        {member.addedAt && (
                          <span>Joined {new Date(member.addedAt).toLocaleDateString('en-US')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {editable && (
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Role for ${member.name || member.email}`}
                        value={member.roleKey}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as RoleKey)}
                        disabled={isBusy || assignable.length === 0}
                        className="rounded-md border border-border bg-bg-input px-2 py-1 text-xs text-text outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {/* Always show the member's current role, plus assignable ones */}
                        {Array.from(new Set([member.roleKey, ...assignable])).map((key) => (
                          <option key={key} value={key}>
                            {lookupRole(key)?.displayName ?? key}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRemove(member.id)}
                        className="rounded-md border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
