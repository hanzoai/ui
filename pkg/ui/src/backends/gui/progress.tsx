'use client'

/** Progress — determinate bar; `value` is 0–100. */
import { Progress as GuiProgress } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

export type ProgressProps = ComponentProps<typeof GuiProgress>

const Progress = ({ value, ...props }: ProgressProps) => (
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
    <GuiProgress.Indicator {...slot('progress-indicator')} bg="$color12" />
  </GuiProgress>
)

export { Progress }
