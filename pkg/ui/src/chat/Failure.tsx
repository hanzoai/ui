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
import type { ComponentProps, ReactNode } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { XStack, YStack } from '@hanzo/gui'
import { RefreshCw, TriangleAlert } from '@hanzogui/lucide-icons-2'

import { Button } from '../backends/gui'
import { ink } from '../backends/gui/ink'
import { slot } from '../backends/gui/slot'
import { RING } from '../backends/gui/press'

export interface FailureProps extends Omit<ComponentProps<typeof YStack>, 'children'> {
  /** What went wrong, in the surface's own words. */
  children?: ReactNode
  /** Offer to run the turn again. Omit and no control renders. */
  onRetry?: () => void
  /** The retry control's words; absent, "Try again" in the reader's language. */
  retryLabel?: string
}

export function Failure({ children, onRetry, retryLabel, ...props }: FailureProps) {
  const { t } = useI18n()

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
      // The `stopped` register from `product/tone.ts`: an outline with a calm
      // semantic error edge, never a loud red fill.
      borderColor="$borderColor"
      borderInlineStartWidth={2}
      borderInlineStartColor="var(--state-error)"
      bg="$panel"
      {...props}
    >
      <XStack items="flex-start" gap="$2" width="100%">
        <XStack pt={2} shrink={0} items="center" justify="center">
          <TriangleAlert size={14} color="var(--state-error)" aria-hidden />
        </XStack>
        <YStack grow={1} minW={0}>
          {ink(children, undefined, { size: '$2', color: '$ink' })}
        </YStack>
      </XStack>

      {onRetry ? (
        // A real Button: a View wearing `role="button"` takes focus and then
        // ignores Enter and Space.
        <XStack self="flex-start">
          <Button {...slot('failure-retry')} variant="outline" size="sm" onPress={onRetry} focusVisibleStyle={RING} $max-sm={{ minH: 44 }}>
            <RefreshCw size={13} />
            {retryLabel ?? t('Try again')}
          </Button>
        </XStack>
      ) : null}
    </YStack>
  )
}
