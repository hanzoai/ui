/**
 * Hanzo semantic color tokens.
 *
 * Zinc-based neutral palette with oklch values extracted from
 * the canonical Hanzo UI dark/light theme CSS variables.
 */

/** Neutral ladder (hex) — the canonical base ramp (Tailwind neutral). This is
 *  the ladder the CSS custom properties (`--neutral-*` in theme.ts) are cut from;
 *  prefer it over `zinc` below, which stays only for back-compat. */
export const neutral = {
  50:  "#fafafa",
  100: "#f5f5f5",
  200: "#e5e5e5",
  300: "#d4d4d4",
  400: "#a3a3a3",
  500: "#737373",
  600: "#525252",
  700: "#404040",
  800: "#262626",
  900: "#171717",
  950: "#0a0a0a",
} as const

/** Zinc neutral palette (hex, for non-CSS consumers) */
export const zinc = {
  50:  "#fafafa",
  100: "#f4f4f5",
  200: "#e4e4e7",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#52525b",
  700: "#3f3f46",
  800: "#27272a",
  900: "#18181b",
  950: "#09090b",
} as const

/** oklch values used by Hanzo UI CSS variables */
export const oklch = {
  black:   "oklch(0.145 0 0)",
  white:   "oklch(0.985 0 0)",
  zinc50:  "oklch(0.985 0 0)",
  zinc100: "oklch(0.97 0 0)",
  zinc200: "oklch(0.922 0 0)",
  zinc300: "oklch(0.871 0 0)",
  zinc400: "oklch(0.708 0 0)",
  zinc500: "oklch(0.556 0 0)",
  zinc600: "oklch(0.439 0 0)",
  zinc700: "oklch(0.371 0 0)",
  zinc800: "oklch(0.269 0 0)",
  zinc900: "oklch(0.205 0 0)",
  zinc950: "oklch(0.145 0 0)",
} as const

/** HSL values from the Hanzo legacy color system */
export const hsl = {
  fg0:        "hsl(0 0% 100%)",
  fgBody:     "hsl(0 0% 97%)",
  fg1:        "hsl(0 0% 85%)",
  fg2:        "hsl(0 0% 70%)",
  fg3:        "hsl(0 0% 55%)",
  fg4:        "hsl(0 0% 40%)",
  fg5:        "hsl(0 0% 25%)",
  bg0:        "hsl(0 0% 0%)",
  bg1:        "hsl(0 0% 12%)",
  bg2:        "hsl(0 0% 18%)",
  bg3:        "hsl(0 0% 25%)",
  bgOverlay:  "hsla(0 0% 0% / 60%)",
  secondary0: "hsl(266 79% 40%)",
  secondary1: "hsl(266 79% 50%)",
  secondary2: "hsl(266 79% 60%)",
  secondary3: "hsl(266 79% 70%)",
  destructive: "hsl(0 62.8% 45%)",
} as const

/**
 * Flat hex color primitives for use in any runtime — the RESOLVED dark palette.
 * These mirror theme.ts (the source of truth): a #0a0a0a ground, #fafafa ink,
 * the 0a/0f/17/26 surface ladder, and alpha-white hairlines. The earlier revision
 * had drifted to true-black ground with zinc surfaces and a grey primary.
 */
export const colors = {
  black:   "#000000",
  white:   "#fafafa",
  background: "#0a0a0a",
  surface:    "#0f0f0f",
  surface2:   "#171717",
  surface3:   "#262626",
  text:       "#e5e5e5",
  textMuted:  "#a3a3a3",
  textSubtle: "#737373",
  border:     "rgba(255, 255, 255, 0.10)",
  input:      "rgba(255, 255, 255, 0.15)",
  ring:       "rgba(255, 255, 255, 0.40)",
  primary:         "#fafafa",
  primaryForeground: "#0a0a0a",
  secondary:        "#262626",
  secondaryForeground: "#fafafa",
  muted:            "#171717",
  mutedForeground:  "#a3a3a3",
  accent:           "#262626",
  accentForeground: "#fafafa",
  destructive:      "#ef4444",
  destructiveForeground: "#fafafa",
  card:             "#0f0f0f",
  cardForeground:   "#e5e5e5",
  popover:          "#0f0f0f",
  popoverForeground: "#e5e5e5",
} as const

export type ColorToken = keyof typeof colors
export type ZincStep = keyof typeof zinc
