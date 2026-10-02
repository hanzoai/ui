'use client'

/**
 * Primary button — the one high-emphasis action in a view (sign in, save, get
 * started). Secondary and destructive actions use the default neutral `Button`.
 *
 * It wears design's `--primary` family: the white slab on the dark ground, the
 * black one on the light, and — when a person or an org picks an accent — that
 * accent, with the ink that reads on it and the hover that deepens it. All three
 * come from `@hanzo/design`'s `vars()` through the cascade, so a person's accent
 * (written by `@hanzo/appearance`) and an org's (written by `setOrgAccent`) both
 * reach it with nothing to subscribe to. It used to read the org's accent from a
 * JS store, which a person's choice never entered, so the one primary action in
 * a view was the one control that ignored the person's accent.
 *
 * A caller's own `style`/`color` still win (spread last).
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

import { labelOf, useEmit } from './instrument'

export function PrimaryButton({ onPress, ...rest }: ComponentProps<typeof Button>) {
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
  return (
    <Button
      bg="var(--primary)"
      color="var(--primary-foreground)"
      borderColor="var(--primary)"
      hoverStyle={{ bg: 'var(--primary-hover)', borderColor: 'var(--primary-hover)' }}
      pressStyle={{ bg: 'var(--primary-hover)', borderColor: 'var(--primary-hover)' }}
      onPress={handler}
      {...rest}
    />
  )
}
