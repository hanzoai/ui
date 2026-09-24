'use client'

/**
 * EmptyPrompt — what an empty conversation pane says before anything is asked.
 *
 * One line at the top of the pane: a small mark and a question. It is aligned
 * to the COLUMN the composer sits in, not centred on the pane, so the question
 * and the field that answers it start at the same left edge — the eye reads
 * down one line into the other.
 *
 * The mark is a slot, never a brand this package picks: a surface passes its
 * own (`BrandMark`, an org mark, nothing), and the heading is the same either
 * way.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

import { slot } from '../backends/gui/slot'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** The composer column's width, so the two line up by default. */
const COLUMN = 768

/** What an empty pane asks when the surface says nothing else. */
export const NEXT = 'What’s up next?'

export interface EmptyPromptProps extends Col {
  /** The question. */
  title?: ReactNode
  /** Drawn before the question — a surface's own mark, ~20px. */
  mark?: ReactNode
  /** The column the heading aligns to, px. Match the composer's. */
  column?: number
  /** The heading's outline level; a pane with a page title above it passes 2. */
  level?: 1 | 2 | 3
}

export function EmptyPrompt({
  title = NEXT,
  mark,
  column = COLUMN,
  level = 1,
  ...rest
}: EmptyPromptProps) {
  return (
    <YStack {...slot('empty-prompt')} width="100%" items="center" px="$4" pt="$2.5" {...rest}>
      <XStack width="100%" maxW={column} items="center" gap="$2">
        {mark ? (
          <XStack {...slot('empty-prompt-mark')} shrink={0} items="center" aria-hidden>
            {mark}
          </XStack>
        ) : null}
        <SizableText
          {...slot('empty-prompt-title')}
          role="heading"
          aria-level={level}
          size="$7"
          color="$ink"
        >
          {title}
        </SizableText>
      </XStack>
    </YStack>
  )
}
