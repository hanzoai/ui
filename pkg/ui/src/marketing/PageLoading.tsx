'use client'

/**
 * PageLoading — the whole page while it loads: one spinner, centred, and
 * nothing else.
 *
 * It fills the viewport, so the frame that replaces it (the page, or the next
 * screen of a sign-in) starts from a box of the same size and nothing moves. It
 * draws no header, footer or field: a route that has none of them while it loads
 * is what a reader should meet first.
 *
 * `role="status"` with a label, because the spinner itself is `aria-hidden`.
 */
import { YStack } from '@hanzo/gui'
import type { ComponentProps } from 'react'

import { slot } from '../backends/gui/slot'
import { Spinner } from '../backends/gui/spinner'

export type PageLoadingProps = Omit<ComponentProps<typeof YStack>, 'children'> & {
  /** What assistive tech hears. */
  label?: string
}

const PageLoading = ({ label = 'Loading', ...p }: PageLoadingProps) => (
  <YStack
    {...slot('page-loading')}
    role="status"
    aria-label={label}
    width="100%"
    minH="100dvh"
    items="center"
    justify="center"
    {...(p as object)}
  >
    <Spinner size={28} color="var(--quiet, currentColor)" />
  </YStack>
)

export { PageLoading }
