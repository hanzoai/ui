'use client'

/** Label — form-control caption bound to its field by @hanzogui/label. */
import { Label as GuiLabel } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

export type LabelProps = ComponentProps<typeof GuiLabel>

const Label = (props: LabelProps) => (
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
    {...props}
  />
)

export { Label }
