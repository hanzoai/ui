/**
 * Hanzo spacing scale (0-20).
 *
 * 4px base unit. Values in px as strings for CSS and as numbers for JS consumers.
 */

export const spacing = {
  0:    "0px",
  0.5:  "2px",
  1:    "4px",
  1.5:  "6px",
  2:    "8px",
  2.5:  "10px",
  3:    "12px",
  3.5:  "14px",
  4:    "16px",
  5:    "20px",
  6:    "24px",
  7:    "28px",
  8:    "32px",
  9:    "36px",
  10:   "40px",
  11:   "44px",
  12:   "48px",
  14:   "56px",
  16:   "64px",
  18:   "72px",
  20:   "80px",
} as const

/** Numeric spacing values in pixels */
export const spacingPx = {
  0:    0,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  3.5:  14,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  9:    36,
  10:   40,
  11:   44,
  12:   48,
  14:   56,
  16:   64,
  18:   72,
  20:   80,
} as const

export type SpacingStep = keyof typeof spacing
