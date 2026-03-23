/**
 * Hanzo typography tokens.
 *
 * Primary font: Geist Sans (--font-sans fallback chain from Hanzo UI CSS).
 * Mono font: Geist Mono.
 */

export const fontFamily = {
  sans: "'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
} as const

export const fontSize = {
  xs:   "0.75rem",    // 12px
  sm:   "0.875rem",   // 14px
  base: "1rem",       // 16px
  lg:   "1.125rem",   // 18px
  xl:   "1.25rem",    // 20px
  "2xl": "1.5rem",    // 24px
  "3xl": "1.875rem",  // 30px
  "4xl": "2.25rem",   // 36px
  "5xl": "3rem",      // 48px
  "6xl": "3.75rem",   // 60px
  "7xl": "4.5rem",    // 72px
  "8xl": "6rem",      // 96px
  "9xl": "8rem",      // 128px
} as const

export const fontSizePx = {
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
  "8xl": 96,
  "9xl": 128,
} as const

export const lineHeight = {
  none:    "1",
  tight:   "1.25",
  snug:    "1.375",
  normal:  "1.5",
  relaxed: "1.625",
  loose:   "2",
} as const

export const fontWeight = {
  thin:       "100",
  extralight: "200",
  light:      "300",
  normal:     "400",
  medium:     "500",
  semibold:   "600",
  bold:       "700",
  extrabold:  "800",
  black:      "900",
} as const

export const letterSpacing = {
  tighter: "-0.05em",
  tight:   "-0.025em",
  normal:  "0em",
  wide:    "0.025em",
  wider:   "0.05em",
  widest:  "0.1em",
  /** Hanzo body default from hanzo-common.css */
  body:    "0.15px",
} as const

export type FontSizeToken = keyof typeof fontSize
export type FontWeightToken = keyof typeof fontWeight
