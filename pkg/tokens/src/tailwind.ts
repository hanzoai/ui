/**
 * Tailwind CSS plugin / theme extension for Hanzo tokens.
 *
 * Usage in tailwind.config:
 *   import { hanzoTheme } from "@hanzo/tokens/tailwind"
 *   export default { theme: { extend: hanzoTheme } }
 */

import { colors, zinc } from "./colors"
import { spacing } from "./spacing"
import { radii } from "./radii"
import { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing } from "./typography"

export const hanzoTheme = {
  colors: {
    ...colors,
    zinc,
  },
  spacing,
  borderRadius: radii,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} as const

export { colors, zinc, spacing, radii, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }
