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
// gui's Button, still — and this is the one place the ladder is knowingly not
// enforced yet. Ours SHOULD back this: gui's renders at 44px with gui's own
// radius, so every PrimaryButton in the fleet sits a size above the 36px ladder,
// beside a 36px field. That is the form stepping console shows across 56 call
// sites.
//
// It cannot be a one-line swap. gui's Button takes `icon` and `iconAfter` as
// PROPS; ours has `icon` only as a SIZE name and renders glyphs as children. So
// the swap breaks every caller that passes one — EmptyState and SocialResource
// among them, caught by tsc rather than by review. Doing it properly means
// adding `icon`/`iconAfter` to the canonical Button, which is a new public API
// on the component every surface depends on, and it wants its own change.
import { Button } from '@hanzo/gui'

import { useAccent } from './accent'
import { labelOf, useEmit } from './instrument'

export function PrimaryButton({ onPress, ...rest }: ComponentProps<typeof Button>) {
  const { accent, contrast } = useAccent()
  const track = useEmit()
  // DESTRUCTURE the caller's handler out first. Wrapping it while still reading it
  // off a rebound `props` makes the wrapper call ITSELF — an unbounded recursion
  // that a real browser click turns into "Maximum call stack size exceeded".
  const press = (e: unknown) => {
    // The label IS the identity of a primary action — no app has to name it.
    track({
      component: 'PrimaryButton',
      action: 'click',
      id: labelOf(rest.children) ?? rest['aria-label'],
    })
    ;(onPress as ((e: unknown) => void) | undefined)?.(e)
  }
  const handler = press as ComponentProps<typeof Button>['onPress']
  // Accent set → a filled accent button (bg + readable text, via inline style Tamagui
  // forwards to the DOM). No accent → the default monochrome white (theme="light").
  if (accent) {
    return <Button style={{ backgroundColor: accent, color: contrast, borderColor: accent }} onPress={handler} {...rest} />
  }
  return <Button theme="light" onPress={handler} {...rest} />
}
