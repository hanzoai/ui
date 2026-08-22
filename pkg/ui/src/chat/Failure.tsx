'use client'

/**
 * Failure — the turn did not arrive, and what to do about it.
 *
 * Distinct from a `Step` that errored: a step can fail inside an answer that
 * still lands. Retry sits beside the message, not in the hover strip, so it is
 * reachable on a touch device.
 *
 * `role="alert"` with `aria-live="assertive"`: the reader is waiting on prose
 * that is never coming, which is the one event in a conversation that has to
 * interrupt.
 */
import { XStack, YStack } from '@hanzo/gui'
import { RefreshCw } from '@hanzogui/lucide-icons-2'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from '../backends/gui'
import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'

export interface FailureProps extends Omit<ComponentProps<typeof YStack>, 'children'> {
  /** What went wrong, in the surface's own words. */
  children?: ReactNode
  /** Offer to run the turn again. Omit and no control renders. */
  onRetry?: () => void
  retryLabel?: string
}

export function Failure({ children, onRetry, retryLabel = 'Try again', ...props }: FailureProps) {
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
      // The `stopped` register from `product/tone.ts`: an outline, not a hue.
      borderColor="$faint"
      bg="$edge"
      {...props}
    >
      {ink(children, undefined, { size: '$2', color: '$ink' })}
      {onRetry ? (
        // A real Button: a View wearing `role="button"` takes focus and then
        // ignores Enter and Space.
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
