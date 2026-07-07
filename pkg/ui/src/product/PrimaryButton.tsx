'use client'

/**
 * Primary button — the one white, high-emphasis action for the console.
 *
 * Monochrome brand: `theme="light"` flips the button to the light theme inside
 * the dark console, giving a white fill with a near-black label and icon — no
 * hue accent. Use it for the single primary action in a view (sign in, save,
 * get started). Secondary and destructive actions use the default neutral
 * `Button`.
 */
import type { ComponentProps } from 'react'
import { Button } from '@hanzo/gui'

export function PrimaryButton(props: ComponentProps<typeof Button>) {
  return <Button theme="light" {...props} />
}
