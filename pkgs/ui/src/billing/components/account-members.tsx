'use client'

import * as React from 'react'
import type { BillingAccountMember, BillingRole } from '../types'

export interface AccountMembersProps {
  members: BillingAccountMember[]
  userRole: BillingRole
  onInvite?: (email: string, role: BillingRole) => Promise<void>
  onChangeRole?: (memberId: string, role: BillingRole) => Promise<void>
  onRemove?: (memberId: string) => Promise<void>
}

const ROLES: BillingRole[] = ['owner', 'admin', 'viewer']

function roleBadgeClass(role: BillingRole): string {
  switch (role) {
    case 'owner':
      return 'bg-brand/20 text-brand'
    case 'admin':
      return 'bg-amber-500/20 text-amber-400'
    case 'viewer':
      return 'bg-text-dim/20 text-text-muted'
  }
}

const INPUT_CLASS = 'rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text outline-none transition focus:border-brand'

export function AccountMembers({ members, userRole, onInvite, onChangeRole, onRemove }: AccountMembersProps) {
  const canManage = userRole === 'owner' || userRole === 'admin'
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState<BillingRole>('viewer')
  const [inviting, setInviting] = React.useState(false)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const handleInvite = React.useCallback(async () => {
    if (!inviteEmail.includes('@') || !onInvite) return
    setInviting(true)
    try {
      await onInvite(inviteEmail, inviteRole)
      setInviteEmail('')
      setInviteRole('viewer')
    } finally {
      setInviting(false)
    }
  }, [inviteEmail, inviteRole, onInvite])

  const handleChangeRole = React.useCallback(async (memberId: string, role: BillingRole) => {
    if (!onChangeRole) return
    setBusyId(memberId)
    try {
      await onChangeRole(memberId, role)
    } finally {
      setBusyId(null)
    }
  }, [onChangeRole])

  const handleRemove = React.useCallback(async (memberId: string) => {
    if (!onRemove) return
    setBusyId(memberId)
    try {
      await onRemove(memberId)
    } finally {
      setBusyId(null)
    }
  }, [onRemove])

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border p-4">
          <h3 className="text-lg font-semibold text-text">Team members</h3>
          <p className="text-sm text-text-muted">
            {canManage
              ? 'Manage who has access to this billing account.'
              : 'View members of this billing account.'}
          </p>
        </div>

        {/* Invite form -- only for owner/admin */}
        {canManage && onInvite && (
          <div className="flex flex-wrap items-end gap-3 border-b border-border p-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-xs font-medium text-text-muted">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className={`${INPUT_CLASS} w-full`}
              />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-text-muted">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as BillingRole)}
                className={`${INPUT_CLASS} w-full`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!inviteEmail.includes('@') || inviting}
              onClick={handleInvite}
              className="rounded-lg bg-text px-4 py-2 text-sm font-medium text-bg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        )}

        {/* Members list */}
        <div className="divide-y divide-border">
          {members.length === 0 ? (
            <div className="p-6 text-sm text-text-muted">No members yet.</div>
          ) : (
            members.map((member) => {
              const isBusy = busyId === member.id
              return (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm font-bold text-brand">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{member.name || member.email}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{member.email}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(member.role)}`}>
                          {member.role}
                        </span>
                        <span>Joined {new Date(member.addedAt).toLocaleDateString('en-US')}</span>
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as BillingRole)}
                        disabled={isBusy}
                        className="rounded-md border border-border bg-bg-input px-2 py-1 text-xs text-text outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRemove(member.id)}
                        className="rounded-md border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-500 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? 'Removing...' : 'Remove'}
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
