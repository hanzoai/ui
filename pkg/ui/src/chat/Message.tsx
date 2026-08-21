'use client'

/**
 * Message — one turn in a thread.
 *
 * Role drives presentation and nothing else: a user turn is a contained bubble
 * that shrinks to its content, an assistant turn is full-bleed prose, a system
 * turn is a muted aside. Content is `children`, so the surface keeps its own
 * markdown pipeline — the surfaces disagree on remark plugins and none of that
 * belongs in a presentational package.
 *
 * That arrangement is not this package's taste; it is what all six turn
 * renderers across the estate independently arrived at. hanzo/chat states it
 * outright in `client/src/components/Chat/Messages/ui/MessageRender.tsx:131`:
 * "the user's turn is a glass bubble on the right, the reply plain and full
 * width — the contrast is what says who is speaking." No avatar, no sender
 * name, no timestamp — which is why `icon` is opt-in and there is no `name`
 * prop. Only the read-only share view renders a name, and only one surface
 * renders a timestamp.
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import type { ReactNode } from 'react'

import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'

export type Role = 'user' | 'assistant' | 'system'

/**
 * The mark that says a turn is still arriving.
 *
 * Placed by whoever knows where the prose ends. A surface rendering markdown
 * owns that node and can append this inside it; `Message busy` puts it at the
 * end of the turn instead, which is all this package can know.
 *
 * It does not blink. Every surface that ships one draws it static — an 8x16
 * block on hanzo.app `/chat`, a 2px caret in the builder, a 12px `⬤` from
 * hanzo/chat's `.result-streaming::after`. A caret is the narrowest of the
 * three and the one that reads as "the sentence continues" rather than as a
 * bullet. Decorative, so it is hidden from assistive tech: the turn's text is
 * already live-announced by the surface, and a cursor announced as content is
 * noise on every token.
 */
export function Caret() {
  return <YStack {...slot('caret')} width={2} height={15} rounded={1} bg="$color12" aria-hidden />
}

export interface MessageProps {
  role: Role
  children?: ReactNode
  /** Row rendered under the turn — copy, retry, feedback. */
  actions?: ReactNode
  /** The turn is still streaming: a `Caret` closes the body. */
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
        // 85%, because that is the number three independent implementations
        // reached: hanzo/chat's `USER_TURN` (`common/turn.ts:17`,
        // `max-w-[85%]`), hanzo.app `/chat` (`app/chat/page.tsx:521`,
        // `maxWidth="85%"`) and the app builder's `UserBubble`
        // (`ask-ai/chat-thread.tsx:141`). This package said 80% and no one
        // said 80%.
        maxW={mine ? '85%' : '100%'}
        flex={mine ? undefined : 1}
        {...(mine && {
          bg: '$color3',
          rounded: '$5',
          px: '$3',
          py: '$2',
        })}
      >
        {ink(children)}
        {busy ? <Caret /> : null}
        {actions ? <XStack gap="$1" items="center">{actions}</XStack> : null}
      </YStack>
    </XStack>
  )
}
