'use client'

/**
 * Message — one turn in a thread.
 *
 * Role drives presentation and nothing else: a user turn is a contained bubble
 * that shrinks to its content, an assistant turn is full-bleed prose, a system
 * turn is a muted aside. The contrast is what says who is speaking, so there is
 * no name and no timestamp, and `icon` is opt-in.
 *
 * Content is `children`: the markdown pipeline stays with the surface. A turn
 * that arrived as a list of parts puts `<Parts>` there — `Chat` does exactly
 * that — so this component keeps knowing nothing about the wire.
 */
import { Text, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'
import { useReducedMotion } from './useReducedMotion'

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
  const reducedMotion = useReducedMotion()

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
  // A user turn is a tight bubble: no dead row inside it. Its actions sit
  // outside, below it, so a hidden row never leaves a gap at the bottom.
  if (mine)
    return (
      <XStack
        {...slot('message')}
        data-role={role}
        width="100%"
        justify="flex-end"
        gap="$2"
        // Makes `actions` revealable with `$group-hover`. Unnamed: gui types
        // `group` as a boolean, so a name does not compile.
        group
        {...props}
      >
        <YStack items="flex-end" maxW="85%" gap="$1">
          <YStack {...slot('message-body')} data-bubble="true" gap="$2" bg="$hover" rounded={9999} px="$3.5" py="$2" {...body}>
            {ink(children)}
            {busy ? <Caret /> : null}
          </YStack>
          {actions ? (
            <XStack
              {...slot('message-actions')}
              data-motion="fade"
              gap="$1"
              items="center"
              justify="flex-end"
              minH={28}
              opacity={0}
              transition={reducedMotion ? undefined : 'quickest'}
              $group-hover={{ opacity: 1 }}
              hoverStyle={{ opacity: 1 }}
              focusWithinStyle={{ opacity: 1 }}
              $max-sm={{ opacity: 0.72 }}
              $touchable={{ opacity: 0.72 }}
            >
              {actions}
            </XStack>
          ) : null}
        </YStack>
      </XStack>
    )

  return (
    <XStack
      {...slot('message')}
      data-role={role}
      width="100%"
      justify="flex-start"
      gap="$2"
      // Makes `actions` revealable with `$group-hover`. Unnamed: gui types
      // `group` as a boolean, so a name does not compile.
      group
      {...props}
    >
      {icon ? <YStack pt="$1">{icon}</YStack> : null}
      <YStack
        {...slot('message-body')}
        gap="$2"
        maxW="100%"
        flex={1}
        {...body}
      >
        {ink(children)}
        {busy ? <Caret /> : null}
        {actions ? (
          <XStack
            {...slot('message-actions')}
            data-motion="fade"
            gap="$1"
            items="center"
            justify="flex-start"
            minH={28}
            opacity={0}
            transition={reducedMotion ? undefined : 'quickest'}
            $group-hover={{ opacity: 1 }}
            hoverStyle={{ opacity: 1 }}
            focusWithinStyle={{ opacity: 1 }}
            $max-sm={{ opacity: 0.72 }}
            $touchable={{ opacity: 0.72 }}
          >
            {actions}
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  )
}
