/**
 * Hanzo border-radius tokens.
 *
 * Base radius is 0.5rem (8px), matching --radius in the Hanzo UI CSS.
 */

export const radii = {
  none: "0px",
  sm:   "calc(0.5rem - 4px)",   // 4px
  md:   "calc(0.5rem - 2px)",   // 6px
  lg:   "0.5rem",               // 8px  (base)
  xl:   "calc(0.5rem + 4px)",   // 12px
  "2xl": "calc(0.5rem + 8px)",  // 16px
  full: "9999px",
} as const

/** Numeric radius values in pixels */
export const radiiPx = {
  none: 0,
  sm:   4,
  md:   6,
  lg:   8,
  xl:   12,
  "2xl": 16,
  full: 9999,
} as const

export type RadiusToken = keyof typeof radii
