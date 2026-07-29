'use client'

/** Progress — determinate bar; `value` is 0–100. */
import { Progress as GuiProgress } from '@hanzo/gui'
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
    bg="$color4"
    rounded="$10"
    overflow="hidden"
    {...props}
  >
    <GuiProgress.Indicator
      {...slot('progress-indicator')}
      bg="$color12"
      className={indicatorClassName}
    />
  </GuiProgress>
)

export { Progress }
