import type { ComponentType } from 'react'
import type { GetThemeValueForKey } from '@hanzo/gui'

/**
 * Bridge between raw CSS colors (product hex accents) and Gui's typed `color`
 * prop. Gui types `color` as a theme-token template (`$color12`, …), but ANY CSS
 * color is valid at runtime — so tinting an icon with a product hex needs one
 * sanctioned cast, in ONE place, rather than `as any` scattered around.
 */
export type IconColor = GetThemeValueForKey<'color'>

/** Cast a raw CSS color (e.g. `#5E6AD2`) to Gui's `color` prop type. */
export const asColor = (hex: string): IconColor => hex as unknown as IconColor

/** A lucide/Gui icon component that accepts a size + a (token-or-cast) color —
 *  the shape the shell passes around for product/nav icons. */
export type IconLike = ComponentType<{ size?: number; color?: IconColor }>
