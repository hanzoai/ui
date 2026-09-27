'use client'

/**
 * Home — a fresh pane: the question, and the field that answers it, together in
 * the middle of the page.
 *
 * The mark and the question are one centred line at the display size ($8); the
 * composer and its chips arrive as `children` and sit under it in the same
 * column, so the eye reads straight down from the one into the other. A run's
 * own page keeps its composer at the foot; this is the page before there is a
 * run.
 *
 * `EmptyPrompt` is the other empty state — a smaller question at the top of the
 * column, for a pane whose composer stays at the foot.
 *
 * The mark is a slot, never a brand this package picks: a surface passes its
 * own (`HanzoMark`, an org mark, nothing), and the heading is the same either
 * way.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import { NEXT } from './EmptyPrompt'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** The composer column's width, so the question and the field share it. */
const COLUMN = 768

export interface HomeProps extends Col {
  /** The question. */
  title?: ReactNode
  /** Drawn before the question — a surface's own mark, ~26px. */
  mark?: ReactNode
  /** The column the question and the composer share, px. */
  column?: number
  /** The heading's outline level; a pane with a page title above it passes 2. */
  level?: 1 | 2 | 3
  /** The composer, and whatever the surface says beside it. */
  children?: ReactNode
}

export function Home({ title = NEXT, mark, column = COLUMN, level = 1, children, ...rest }: HomeProps) {
  return (
    <YStack
      {...slot('home')}
      flex={1}
      minH={0}
      minW={0}
      items="center"
      justify="center"
      px="$4"
      // Weighted a little above the middle, where the eye lands on an empty page.
      pb="$10"
      overflow="scroll"
      {...rest}
    >
      <YStack width="100%" maxW={column} gap="$5">
        <XStack justify="center" items="center" gap="$3" flexWrap="wrap">
          {mark ? (
            <XStack {...slot('home-mark')} shrink={0} items="center" aria-hidden>
              {mark}
            </XStack>
          ) : null}
          <SizableText
            {...slot('home-title')}
            role="heading"
            aria-level={level}
            size="$8"
            color="$ink"
            text="center"
          >
            {title}
          </SizableText>
        </XStack>
        {children ? <YStack gap="$2">{children}</YStack> : null}
      </YStack>
    </YStack>
  )
}
