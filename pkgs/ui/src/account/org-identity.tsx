'use client'
/**
 * OrgIdentityRow — the org header used atop account/settings pages and in org
 * switchers. Avatar (emoji | image | initials) + name + optional plan badge.
 */
import * as React from 'react'

import { Badge } from '../../primitives/badge'
import { AccountAvatar } from './account-avatar'
import { cn } from '../utils'
import type { OrgIdentity } from './types'

export interface OrgIdentityRowProps {
  org: OrgIdentity
  size?: 'sm' | 'md'
  className?: string
}

export const OrgIdentityRow = React.forwardRef<
  HTMLDivElement,
  OrgIdentityRowProps
>(({ org, size = 'md', className }, ref) => {
  const sm = size === 'sm'
  return (
    <div ref={ref} className={cn('flex items-center gap-3', className)}>
      <AccountAvatar
        name={org.name}
        imageUrl={org.avatarUrl}
        emoji={org.avatarEmoji}
        className={sm ? 'size-8' : 'size-10'}
        textClassName={sm ? 'text-sm' : 'text-base'}
      />
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate font-semibold tracking-tight',
              sm ? 'text-sm' : 'text-base',
            )}
          >
            {org.name}
          </span>
          {org.planLabel && (
            <Badge
              variant="secondary"
              className={cn('shrink-0', sm && 'h-5 px-1.5 text-[0.65rem]')}
            >
              {org.planLabel}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
})
OrgIdentityRow.displayName = 'OrgIdentityRow'
