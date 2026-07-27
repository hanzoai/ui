'use client'

/**
 * Primary button — the one white, high-emphasis action for the console.
 *
 * Monochrome brand: `theme="light"` flips the button to the light theme inside
 * the dark console, giving a white fill with a near-black label and icon — no
 * hue accent. Use it for the single primary action in a view (sign in, save,
 * get started). Secondary and destructive actions use the default neutral
 * `Button`.
 *
 * When an org enables a custom brand color, this — the console's one primary
 * action — recolors to the org accent (inline bg + the color prop the label/icon
 * inherit), reading the live accent from `useAccent()`; with no custom theme it
 * stays the default white. A caller's own `style`/`color` still win (spread last).
 */
import type { ComponentProps } from 'react'
import { Button } from '@hanzo/gui'

import { useAccent } from './accent'

export function PrimaryButton(props: ComponentProps<typeof Button>) {
  const { accent, contrast } = useAccent()
  // Accent set → a filled accent button (bg + readable text, via inline style Tamagui
  // forwards to the DOM). No accent → the default monochrome white (theme="light").
  if (accent) {
    return <Button style={{ backgroundColor: accent, color: contrast, borderColor: accent }} {...props} />
  }
  return <Button theme="light" {...props} />
}
