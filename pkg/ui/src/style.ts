// style.ts — the class names a component wears, as functions.
//
// These are strings and arithmetic. They live apart from the components that use
// them because a component renders through @hanzo/gui, the engine holds its theme
// in React context, and a module that reaches context is a client module — so a
// page computing a button's classes on the server would be calling across a
// boundary, which React reports as "Invalid reference" from a component nobody
// wrote.
//
// The boundary belongs on the components, not on the functions. `dist.test.ts`
// asserts that for `cn`, `tw`, `sx` and `types`; this is the same rule applied to
// the names those components wear.
//
// The types come from the components as TYPES, which erase — so naming them here
// costs no import at run time and keeps one definition of what a variant is.

import type { Dimensions } from './types'
import type { ButtonSize, ButtonVariant } from './backends/gui/button'
import type { BadgeVariant } from './backends/gui/badge'

/**
 * A button's classes.
 *
 * Variant and size share the `btn-` namespace, so the two defaults collide on
 * `btn-default`. A Set emits it once; no name is used by both a variant and a
 * size, so nothing else can merge.
 */
export const buttonVariants = ({
  variant,
  size,
  className,
}: { variant?: ButtonVariant | null; size?: ButtonSize | null; className?: string } = {}) =>
  [...new Set([`btn`, `btn-${variant ?? 'default'}`, `btn-${size ?? 'default'}`, className].filter(Boolean))]
    .join(' ')

/** A badge's classes. */
export const badgeVariants = ({ variant }: { variant?: BadgeVariant | null } = {}) =>
  `badge badge-${variant ?? 'default'}`

/** The class a navigation-menu trigger wears. Declared in motion.css. */
export const navigationMenuTriggerStyle = () => 'hz-nav-menu-trigger'

/**
 * `dim` scaled to sit inside `to`, keeping its proportions.
 *
 * Returns `to` unchanged for a source with no dimensions: a media element whose
 * intrinsic size is not known yet occupies the space it was given rather than
 * collapsing.
 */
export const fit = (dim: Dimensions, to: Dimensions, scale = 1): Dimensions => {
  if (!dim?.w || !dim?.h) return to
  const r = Math.min(to.w / dim.w, to.h / dim.h) * scale
  return { w: Math.round(dim.w * r), h: Math.round(dim.h * r) }
}
