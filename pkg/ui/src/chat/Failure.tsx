'use client'

/**
 * Failure — the turn did not complete, and what to do about it.
 *
 * Distinct from a `Step` that errored: a step can fail inside an answer that
 * still arrives, this is the answer not arriving. hanzo/chat keeps the same
 * separation — `ToolCall`'s error state, and separately `MessageContent.tsx:153`
 * swapping the whole body for `ErrorMessage`.
 *
 * Four surfaces draw this line and no two draw it the same way: chat's
 * `ErrorBox` (`components/Messages/Content/Error.tsx`), the app builder's
 * `$red8` text with the prose instruction "Something went wrong — please try
 * again" (`ask-ai/chat-thread.tsx:258`), the extension's `.ae-error` div
 * (`AnswerEngine.tsx:336`), and hanzo.app `/chat`, which is the interesting
 * one: it sets `Message.error` at `app/chat/page.tsx:292` and never reads it
 * anywhere in the render, so a stream that dies reports through a detached
 * banner and the turn itself says nothing.
 *
 * Two of the four offer a way to try again. Both put it next to the message
 * rather than in the hover strip, because a hover affordance on the thing that
 * just failed is not reachable on a touch device.
 *
 * `role="alert"` with `aria-live="assertive"` is chat's, and it is right: a
 * turn failing is the one event in a conversation that has to interrupt, since
 * the reader is waiting on prose that is never going to come.
 */
import { XStack, YStack } from '@hanzo/gui'
import { RefreshCw } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'

import { Button } from '../backends/gui'
import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'

export interface FailureProps {
  /** What went wrong, in the surface's own words. */
  children?: ReactNode
  /** Offer to run the turn again. Omit and no control renders. */
  onRetry?: () => void
  retryLabel?: string
}

export function Failure({ children, onRetry, retryLabel = 'Try again' }: FailureProps) {
  return (
    <YStack
      {...slot('failure')}
      role="alert"
      aria-live="assertive"
      width="100%"
      gap="$2"
      px="$3"
      py="$2.5"
      rounded="$4"
      borderWidth={1}
      // The edge again — see `product/tone.ts`. Its `stopped` register is
      // `$color4` behind a `$color9` border for exactly this: with no hue to
      // spend, an outline is what separates "this one" from its neighbours.
      borderColor="$color9"
      bg="$color4"
    >
      {ink(children, undefined, { size: '$2', color: '$color12' })}
      {onRetry ? (
        // The real Button, not a `role="button"` box with an `onPress`. A View
        // wearing the role takes focus and then does nothing on Enter or Space,
        // because the activation behaviour belongs to the element and not to
        // the attribute — and the one control on a failed turn is the last one
        // that should be pointer-only.
        <XStack self="flex-start">
          <Button {...slot('failure-retry')} variant="outline" size="sm" onPress={onRetry}>
            <RefreshCw size={13} />
            {retryLabel}
          </Button>
        </XStack>
      ) : null}
    </YStack>
  )
}
