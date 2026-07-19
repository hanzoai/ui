'use client'
/**
 * TeamMembersTable — org membership management.
 *
 * Rows carry identity + an editable role + a remove action. Pending invites
 * render dimmed with a badge. A composable invite row (email + role + submit)
 * lives in the footer when `onInvite` is supplied. All data + actions are
 * props; the table validates the invite email at its boundary only.
 */
import * as React from 'react'
import { Trash2, UserPlus } from 'lucide-react'

import { Badge } from '../../primitives/badge'
import { Button } from '../../primitives/button'
import { Label } from '../../primitives/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../primitives/table'
import { AccountAvatar } from './account-avatar'
import { cn } from '../utils'
import type { Member, MemberRole } from './types'

export interface RoleOption {
  value: string
  label: string
}

const DEFAULT_ROLES: RoleOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'billing', label: 'Billing' },
  { value: 'viewer', label: 'Viewer' },
]

const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  billing: 'Billing',
  viewer: 'Viewer',
}

/** Loose but honest email check — the actual authority is the server. */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Ensure the member's current role is selectable even if not in the option set. */
function optionsWith(roles: RoleOption[], current: string): RoleOption[] {
  if (roles.some((r) => r.value === current)) return roles
  return [{ value: current, label: ROLE_LABEL[current] ?? current }, ...roles]
}

export interface TeamMembersTableProps {
  members: Member[]
  /** Assignable roles for the per-row Select and invite row. */
  roles?: RoleOption[]
  onRoleChange?: (id: string, role: MemberRole | string) => void
  onRemove?: (id: string) => void
  /** When set, the invite form row is rendered and submits (email, role). */
  onInvite?: (email: string, role: MemberRole | string) => void
  inviteDefaultRole?: MemberRole | string
  className?: string
}

export const TeamMembersTable = React.forwardRef<
  HTMLDivElement,
  TeamMembersTableProps
>(
  (
    {
      members,
      roles = DEFAULT_ROLES,
      onRoleChange,
      onRemove,
      onInvite,
      inviteDefaultRole,
      className,
    },
    ref,
  ) => {
    const [email, setEmail] = React.useState('')
    const [inviteRole, setInviteRole] = React.useState<string>(
      inviteDefaultRole ?? roles[0]?.value ?? 'member',
    )
    const canSubmit = isValidEmail(email)

    const submitInvite = (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSubmit || !onInvite) return
      onInvite(email.trim(), inviteRole)
      setEmail('')
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm',
          className,
        )}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Member
              </TableHead>
              <TableHead className="h-9 w-[150px] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Role
              </TableHead>
              {onRemove && (
                <TableHead className="h-9 w-10 text-right">
                  <span className="sr-only">Remove</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const editable = Boolean(onRoleChange) && m.role !== 'owner' && !m.pending
              return (
                <TableRow key={m.id} className={cn(m.pending && 'opacity-60')}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <AccountAvatar
                        name={m.name ?? m.email}
                        imageUrl={m.avatarUrl}
                        emoji={m.avatarEmoji}
                        className="size-8"
                        textClassName="text-xs"
                      />
                      <div className="flex min-w-0 flex-col">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {m.name ?? m.email}
                          </span>
                          {m.pending && (
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 text-[0.65rem]"
                            >
                              Pending
                            </Badge>
                          )}
                        </div>
                        {m.name && (
                          <span className="truncate text-xs text-muted-foreground">
                            {m.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) => onRoleChange!(m.id, v)}
                      >
                        <SelectTrigger
                          className="h-8 text-xs"
                          aria-label={`Role for ${m.name ?? m.email}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {optionsWith(roles, m.role).map((r) => (
                            <SelectItem
                              key={r.value}
                              value={r.value}
                              className="text-xs"
                            >
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        {ROLE_LABEL[m.role] ?? m.role}
                      </Badge>
                    )}
                  </TableCell>
                  {onRemove && (
                    <TableCell className="text-right">
                      {m.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${m.name ?? m.email}`}
                          onClick={() => onRemove(m.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {onInvite && (
          <form
            onSubmit={submitInvite}
            className="flex flex-col gap-3 border-t p-3 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="team-invite-email" className="text-xs text-muted-foreground">
                Invite by email
              </Label>
              <input
                id="team-invite-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:w-[150px]">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="h-9 text-sm" aria-label="Invite role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={!canSubmit} className="sm:w-auto">
              <UserPlus className="size-4" />
              Invite
            </Button>
          </form>
        )}
      </div>
    )
  },
)
TeamMembersTable.displayName = 'TeamMembersTable'
