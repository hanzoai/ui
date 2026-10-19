'use client'

/**
 * StackIcon — an icon with a smaller one pinned over its lower-right quadrant:
 * a provider and its state, an app and its connection.
 *
 * Re-expressed from twenty-ui's StackIcon (MIT, see NOTICE): a 16px box, the
 * stacked icon 8px from the left and 7px from the top. Both are decorative.
 */
import { XStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'
import { slot } from './slot'

export type StackIconProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  icon: ReactNode
  stackedIcon: ReactNode
}

export function StackIcon({ icon, stackedIcon, ...props }: StackIconProps) {
  return (
    <XStack {...slot('stack-icon')} aria-hidden position="relative" width={16} height={16} shrink={0} items="center" justify="center" {...props}>
      {icon}
      <XStack position="absolute" l={8} t={7}>
        {stackedIcon}
      </XStack>
    </XStack>
  )
}
