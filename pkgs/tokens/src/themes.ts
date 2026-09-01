/**
 * Hanzo theme definitions — the shadcn-shaped, RESOLVED projection.
 *
 * src/theme.ts is the source of truth for the colour system (and the CSS the
 * whole estate embeds). This module is its resolved, flat view for the small set
 * of consumers that want a shadcn-style object of concrete values a JavaScript
 * runtime can use directly — no `var()` to dereference, because JS cannot. Every
 * value below is the RESOLVED form of the matching token in theme.ts (e.g.
 * `--border: var(--white-10)` resolves to `rgb(255 255 255 / .10)`). When theme.ts
 * changes, these change with it; they are not a second opinion.
 *
 * Dark is primary. The monochrome rule holds here too — the earlier revision had
 * drifted to stock shadcn oklch neutrals (a washed near-#252525 background, a
 * lighter card, a blue-violet sidebarPrimary), which made an app on @hanzo/ui and
 * an app on @hanzo/design not resemble each other. Values are hex/rgb, matching
 * theme.ts exactly.
 */

export interface ThemeTokens {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
  radius: string
  sidebar: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  sidebarAccent: string
  sidebarAccentForeground: string
  sidebarBorder: string
  sidebarRing: string
}

/** Hanzo dark theme (primary) — resolved from theme.ts. */
export const dark: ThemeTokens = {
  background:              "#0a0a0a",
  foreground:              "#fafafa",
  card:                    "#0f0f0f",
  cardForeground:          "#fafafa",
  popover:                 "#0f0f0f",
  popoverForeground:       "#fafafa",
  primary:                 "#fafafa",
  primaryForeground:       "#0a0a0a",
  secondary:               "#262626",
  secondaryForeground:     "#fafafa",
  muted:                   "#171717",
  mutedForeground:         "#a3a3a3",
  accent:                  "#262626",
  accentForeground:        "#fafafa",
  destructive:             "#ef4444",
  destructiveForeground:   "#fafafa",
  border:                  "rgb(255 255 255 / .10)",
  input:                   "rgb(255 255 255 / .15)",
  ring:                    "rgb(255 255 255 / .40)",
  radius:                  "0.5rem",
  sidebar:                 "#0f0f0f",
  sidebarForeground:       "#fafafa",
  sidebarPrimary:          "#fafafa",
  sidebarPrimaryForeground: "#0a0a0a",
  sidebarAccent:           "#262626",
  sidebarAccentForeground: "#fafafa",
  sidebarBorder:           "rgb(255 255 255 / .10)",
  sidebarRing:             "rgb(255 255 255 / .40)",
}

/** Hanzo light theme — resolved from theme.ts (.light). */
export const light: ThemeTokens = {
  background:              "#f7f7f7",
  foreground:              "#0a0a0a",
  card:                    "#f2f2f2",
  cardForeground:          "#0a0a0a",
  popover:                 "#fbfbfb",
  popoverForeground:       "#0a0a0a",
  primary:                 "#0a0a0a",
  primaryForeground:       "#fafafa",
  secondary:               "#e4e4e4",
  secondaryForeground:     "#0a0a0a",
  muted:                   "#ededed",
  mutedForeground:         "#525252",
  accent:                  "#e4e4e4",
  accentForeground:        "#0a0a0a",
  destructive:             "#ef4444",
  destructiveForeground:   "#ffffff",
  border:                  "rgb(0 0 0 / .10)",
  input:                   "rgb(0 0 0 / .15)",
  ring:                    "rgb(0 0 0 / .5)",
  radius:                  "0.5rem",
  sidebar:                 "#f2f2f2",
  sidebarForeground:       "#0a0a0a",
  sidebarPrimary:          "#0a0a0a",
  sidebarPrimaryForeground: "#fafafa",
  sidebarAccent:           "#e4e4e4",
  sidebarAccentForeground: "#0a0a0a",
  sidebarBorder:           "rgb(0 0 0 / .10)",
  sidebarRing:             "rgb(0 0 0 / .5)",
}

export const themes = { dark, light } as const
