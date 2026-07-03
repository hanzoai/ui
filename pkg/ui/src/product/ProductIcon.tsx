'use client'

/**
 * ProductIcon — the Linear-style product tile: a rounded-square block filled with
 * the product's accent color, with the product glyph knocked out in near-white so
 * it reads "cut out" of the color. This is the ONE way a product icon renders in
 * the console chrome (sidebar nav, command palette, product overview header) — a
 * bare tinted glyph is replaced everywhere by this tile.
 *
 * Prop-driven and pure: the accent hex is resolved by the caller (registry-curated
 * → per-user override → stable hash, via `useProductColors().colorOf`) and passed
 * in as `color`, so this component owns only the look, never the palette. With no
 * color it falls back to a tasteful neutral chip ($color12 fill + $color1 glyph) —
 * never a random hue — matching the first-party `ProviderLogo` mark, so first-party
 * marks and product tiles read as one family.
 *
 * The knock-out is the same technique the color-swatch button uses (a raw-hex
 * `backgroundColor` fill + a `#ffffff` glyph) so an arbitrary product accent tints
 * cleanly outside Gui's token palette, in the ONE sanctioned place.
 */
import { XStack } from '@hanzo/gui'

import { asColor, type IconLike } from './color'

export function ProductIcon({
  icon: Icon,
  color,
  size = 24,
}: {
  icon: IconLike
  /** The product's resolved accent hex (e.g. `#5E6AD2`). Omit for the neutral chip. */
  color?: string
  size?: number
}) {
  const radius = Math.round(size * 0.28)
  const glyph = Math.round(size * 0.58)
  const tinted = typeof color === 'string' && color.trim() !== ''

  // Accent tile — product color fill + near-white glyph (the Linear "cut out").
  if (tinted) {
    return (
      <XStack
        width={size}
        height={size}
        items="center"
        justify="center"
        rounded={radius}
        style={{ backgroundColor: color }}
      >
        <Icon size={glyph} color={asColor('#ffffff')} />
      </XStack>
    )
  }

  // No accent — a tasteful neutral chip (consistent with ProviderLogo's mark).
  return (
    <XStack width={size} height={size} items="center" justify="center" rounded={radius} bg="$color12">
      <Icon size={glyph} color="$color1" />
    </XStack>
  )
}
