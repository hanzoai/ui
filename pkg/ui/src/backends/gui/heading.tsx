'use client'

/**
 * Heading — gui's semantic heading, with a `tone`.
 *
 * Sizes stay gui's own rungs, and the record headings are four of them: a
 * settings section or a widget title is `size="$2"` (13), a group header `$1`
 * (12, also twenty-ui's xs, since 12px is Hanzo's text floor), a dialog or
 * empty-state title `$4` (15) — twenty-ui's xs/sm/md/lg
 * (11/12/13/16, MIT, see NOTICE) on Hanzo's ramp. `tone` is the new axis:
 * primary ink, secondary or tertiary, at the heading's own weight. A styled
 * extension rather than a wrapper, so `styled(Heading, …)` in a host still
 * extends the component it always did.
 */
import { Heading as GuiHeading, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'

export const Heading = styled(GuiHeading, {
  name: 'Heading',
  variants: {
    tone: {
      primary: { color: '$ink' },
      secondary: { color: '$quiet' },
      tertiary: { color: '$soft' },
    },
  } as const,
})

export type HeadingProps = ComponentProps<typeof Heading>
