'use client'

/**
 * Label — form-control caption bound to its field by @hanzogui/label.
 *
 * `variant="section"` is the caption over a group of rows — "Favorites",
 * "Workspace", a side panel's group — 12px semibold in the dim ink, and
 * `section-sm` the same with a tighter line, both on Hanzo's 12px text floor
 * (twenty-ui's internal Label, MIT, see NOTICE: 11 and 9px there).
 */
import { Label as GuiLabel } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

export type LabelProps = ComponentProps<typeof GuiLabel> & {
  variant?: 'default' | 'section' | 'section-sm'
}

const SECTION = {
  section: { fontSize: '$1', lineHeight: '$1' },
  'section-sm': { fontSize: '$1', lineHeight: 14 },
} as const

const Label = ({ variant = 'default', ...props }: LabelProps) => (
  <GuiLabel
    {...slot('label')}
    fontSize="$2"
    fontWeight="500"
    // gui's Label sets its line-height to the control rung (44px). A caption is
    // as tall as its text, and the rung leaves 26px of air above every field.
    lineHeight="$2"
    color="$ink"
    select="none"
    cursor="pointer"
    {...(variant === 'default' ? null : { 'data-variant': variant, ...SECTION[variant], fontWeight: '600', color: '$dim', cursor: 'default' })}
    {...props}
  />
)

export { Label }
