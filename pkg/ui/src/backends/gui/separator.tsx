'use client'

/** Separator — a 1px rule on either axis. */
import { Separator as GuiSeparator } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

export type SeparatorProps = Omit<ComponentProps<typeof GuiSeparator>, 'vertical'> & {
  orientation?: 'horizontal' | 'vertical'
  /** Radix parity — gui separators are always presentational. */
  decorative?: boolean
}

const Separator = ({ orientation = 'horizontal', decorative: _decorative, ...props }: SeparatorProps) => (
  <GuiSeparator
    {...slot('separator')}
    data-orientation={orientation}
    vertical={orientation === 'vertical'}
    borderColor="$borderColor"
    {...props}
  />
)

export { Separator }
