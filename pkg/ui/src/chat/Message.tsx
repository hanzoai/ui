'use client'

/**
 * Message — one turn in a thread.
 *
 * Role drives presentation and nothing else: a user turn is a contained bubble
 * that shrinks to its content, an assistant turn is full-bleed prose, a system
 * turn is a muted aside. Content is `children`, so the surface keeps its own
 * markdown pipeline — the surfaces disagree on remark plugins and none of that
 * belongs in a presentational package.
 */
import { SizableText, Text, XStack, YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { slot } from '../backends/gui/slot'

export type Role = 'user' | 'assistant' | 'system'

export interface MessageProps {
  role: Role
  children?: ReactNode
  /** Row rendered under the turn — copy, retry, feedback. */
  actions?: ReactNode
  /** The turn is still streaming. */
  busy?: boolean
  /** Leading affordance for an assistant turn: avatar or model mark. */
  icon?: ReactNode
}

export function Message({ role, children, actions, busy = false, icon }: MessageProps) {
  if (role === 'system')
    return (
      <XStack {...slot('message')} data-role="system" width="100%" justify="center" py="$2">
        <Text fontSize="$1" color="$color10" text="center">
          {children}
        </Text>
      </XStack>
    )

  const mine = role === 'user'
  return (
    <XStack
      {...slot('message')}
      data-role={role}
      width="100%"
      justify={mine ? 'flex-end' : 'flex-start'}
      gap="$2"
    >
      {icon && !mine ? <YStack pt="$1">{icon}</YStack> : null}
      <YStack
        {...slot('message-body')}
        data-bubble={mine ? 'true' : undefined}
        gap="$2"
        maxW={mine ? '80%' : '100%'}
        flex={mine ? undefined : 1}
        {...(mine && {
          bg: '$color3',
          rounded: '$5',
          px: '$3',
          py: '$2',
        })}
      >
        {children}
        {busy ? <SizableText {...slot('message-busy')} size="$2" color="$color10">…</SizableText> : null}
        {actions ? <XStack gap="$1" items="center">{actions}</XStack> : null}
      </YStack>
    </XStack>
  )
}
