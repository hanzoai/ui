'use client'

/** Progress — determinate bar; `value` is 0–100. */
import { Progress as GuiProgress } from '@hanzo/gui'
import { sx } from '../../sx'
import type { ComponentProps } from 'react'
import { slot } from './slot'

export type ProgressProps = ComponentProps<typeof GuiProgress> & {
  /**
   * Class for the moving bar, not the track. Callers colour the bar by
   * threshold (green/amber/red), which the track's own className cannot express
   * because they are different elements. Reaches the DOM on web; inert on
   * native, where gui paints from tokens.
   */
  indicatorClassName?: string
}

const Progress = ({ value, indicatorClassName, ...props }: ProgressProps) => (
  <GuiProgress
    {...slot('progress')}
    value={value ?? 0}
    height={8}
    width="100%"
    bg="$edge"
    rounded="$10"
    overflow="hidden"
    {...props}
  >
    <GuiProgress.Indicator
      {...slot('progress-indicator')}
      // Same reason as the slider's fill: `$ink` is the foreground rung, and
      // a type colour stretched across a bar is a lit slab. 6.93:1 over the
      // track against WCAG 1.4.11's 3:1 — legible with room to spare, and no
      // longer competing with the text beside it for attention.
      bg="$soft"
      {...sx(indicatorClassName)}
    />
  </GuiProgress>
)

export { Progress }
