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
    color="$color12"
    select="none"
    cursor="pointer"
    {...props}
  />
)

export { Label }
