'use client'

/**
 * Message — one turn in a thread.
 *
 * Role drives presentation and nothing else: a user turn is a contained bubble
 * that shrinks to its content, an assistant turn is full-bleed prose, a system
 * turn is a muted aside. The contrast is what says who is speaking, so there is
 * no name and no timestamp, and `icon` is opt-in.
 *
 * Content is `children`: the markdown pipeline stays with the surface.
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'

/**
 * Who is speaking — and it is the WIRE's set, not a presentation set of our own.
 *
 * This was `user | assistant | system`, three roles that look different, which is
 * a reasonable thing to want and the wrong place to want it. A completion carries
 * `tool` too, so `@hanzo/ai`'s `useChat` holds turns this could not accept and
 * `<Chat {...useChat(…)} />` did not typecheck for ANY surface — the one call the
 * pair exists to make work. A component fed by the SDK has to take the SDK's
 * vocabulary; narrowing it here just moves the mismatch to every caller.
 *
 * `tool` presents as the aside `system` does: it is machine chatter about the
 * turn rather than speech in it. A surface that wants tool calls drawn properly
 * has `Step` for that and passes it as children.
 */
export type Role = 'user' | 'assistant' | 'system' | 'tool'

/** What a gui stack accepts. `role` is dropped: here it names the speaker, not
 *  an ARIA role. `aria-label` still reaches the row. */
type Stack = Omit<ComponentProps<typeof XStack>, 'children' | 'role'>

/**
 * The mark that says a turn is still arriving. Static, not blinking.
 *
 * Placed by whoever knows where the prose ends: a surface rendering markdown
 * owns that node and can append this inside it, and `Message busy` puts it at
 * the end of the turn. Decorative, so assistive tech skips it — the surface
 * already live-announces the text.
 */
export function Caret() {
  return <YStack {...slot('caret')} width={2} height={15} rounded={1} bg="$ink" aria-hidden />
}

export interface MessageProps extends Stack {
  role: Role
  children?: ReactNode
  /** Row rendered under the turn — copy, retry, feedback. */
  actions?: ReactNode
  /** The turn is still streaming: a `Caret` closes the body. */
  busy?: boolean
  /** Leading affordance for an assistant turn: avatar or model mark. */
  icon?: ReactNode
  /** The bubble's own props — the inner box, not the row. Reaches the fill, the
   *  corner and the width cap. Absent, nothing changes. */
  body?: Stack
}

export function Message({
  role,
  children,
  actions,
  busy = false,
  icon,
  body,
  ...props
}: MessageProps) {
  // `tool` takes the aside too — see the Role note above. Machine chatter about
  // a turn, not speech in it.
  if (role === 'system' || role === 'tool')
    return (
      <XStack
        {...slot('message')}
        // The attribute says which role it IS, not which branch drew it. It was
        // the literal "system", so a tool turn reported itself as a system one to
        // every gate and every analytics read that keys on this.
        data-role={role}
        width="100%"
        justify="center"
        py="$2"
        {...props}
      >
        <Text fontSize="$1" color="$soft" text="center">
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
      // Makes `actions` revealable with `$group-hover`. Unnamed: gui types
      // `group` as a boolean, so a name does not compile.
      group
      {...props}
    >
      {icon && !mine ? <YStack pt="$1">{icon}</YStack> : null}
      <YStack
        {...slot('message-body')}
        data-bubble={mine ? 'true' : undefined}
        gap="$2"
        // 85% is what the surfaces converged on for a user turn.
        maxW={mine ? '85%' : '100%'}
        flex={mine ? undefined : 1}
        {...(mine && {
          bg: '$hover',
          rounded: '$5',
          px: '$3',
          py: '$2',
        })}
        {...body}
      >
        {ink(children)}
        {busy ? <Caret /> : null}
        {actions ? <XStack gap="$1" items="center">{actions}</XStack> : null}
      </YStack>
    </XStack>
  )
}
