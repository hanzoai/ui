'use client'
/**
 * AccountAvatar — one avatar renderer for every account surface.
 *
 * Resolution order: emoji → image → initials fallback. Internal to the account
 * kit so OrgIdentityRow and TeamMembersTable render identity identically.
 */
import * as React from 'react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../primitives/avatar'
import { cn } from '../utils'

/** Two-letter initials from a name or email local-part. */
export function initialsOf(input?: string): string {
  if (!input) return '?'
  const base = input.includes('@') ? input.split('@')[0] : input
  const parts = base.trim().split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface AccountAvatarProps {
  name?: string
  imageUrl?: string
  emoji?: string
  /** Tailwind sizing/shape override applied to the Avatar root. */
  className?: string
  /** Font-size class for the emoji/initials layer. */
  textClassName?: string
}

export function AccountAvatar({
  name,
  imageUrl,
  emoji,
  className,
  textClassName,
}: AccountAvatarProps) {
  return (
    <Avatar className={cn('rounded-lg', className)}>
      {emoji ? (
        <AvatarFallback
          className={cn('rounded-lg bg-muted', textClassName)}
          aria-label={name}
        >
          <span aria-hidden="true">{emoji}</span>
        </AvatarFallback>
      ) : (
        <>
          {imageUrl && (
            <AvatarImage className="rounded-lg" src={imageUrl} alt={name ?? ''} />
          )}
          <AvatarFallback
            className={cn(
              'rounded-lg bg-muted font-medium text-muted-foreground',
              textClassName,
            )}
          >
            {initialsOf(name)}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  )
}
