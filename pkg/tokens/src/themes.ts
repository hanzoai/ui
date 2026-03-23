/**
 * Hanzo theme definitions.
 *
 * Dark theme is primary. All oklch values are taken directly from
 * the canonical hanzo-default-colors.css.
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

/** Hanzo dark theme (primary) -- oklch values */
export const dark: ThemeTokens = {
  background:              "oklch(0.145 0 0)",
  foreground:              "oklch(0.985 0 0)",
  card:                    "oklch(0.205 0 0)",
  cardForeground:          "oklch(0.985 0 0)",
  popover:                 "oklch(0.269 0 0)",
  popoverForeground:       "oklch(0.985 0 0)",
  primary:                 "oklch(0.922 0 0)",
  primaryForeground:       "oklch(0.205 0 0)",
  secondary:               "oklch(0.269 0 0)",
  secondaryForeground:     "oklch(0.985 0 0)",
  muted:                   "oklch(0.269 0 0)",
  mutedForeground:         "oklch(0.708 0 0)",
  accent:                  "oklch(0.371 0 0)",
  accentForeground:        "oklch(0.985 0 0)",
  destructive:             "oklch(0.704 0.191 22.216)",
  destructiveForeground:   "oklch(0.58 0.22 27)",
  border:                  "oklch(1 0 0 / 10%)",
  input:                   "oklch(1 0 0 / 15%)",
  ring:                    "oklch(0.556 0 0)",
  radius:                  "0.5rem",
  sidebar:                 "oklch(0.205 0 0)",
  sidebarForeground:       "oklch(0.985 0 0)",
  sidebarPrimary:          "oklch(0.488 0.243 264.376)",
  sidebarPrimaryForeground: "oklch(0.985 0 0)",
  sidebarAccent:           "oklch(0.269 0 0)",
  sidebarAccentForeground: "oklch(0.985 0 0)",
  sidebarBorder:           "oklch(1 0 0 / 10%)",
  sidebarRing:             "oklch(0.439 0 0)",
}

/** Hanzo light theme -- oklch values */
export const light: ThemeTokens = {
  background:              "oklch(1 0 0)",
  foreground:              "oklch(0.145 0 0)",
  card:                    "oklch(1 0 0)",
  cardForeground:          "oklch(0.145 0 0)",
  popover:                 "oklch(1 0 0)",
  popoverForeground:       "oklch(0.145 0 0)",
  primary:                 "oklch(0.205 0 0)",
  primaryForeground:       "oklch(0.985 0 0)",
  secondary:               "oklch(0.97 0 0)",
  secondaryForeground:     "oklch(0.205 0 0)",
  muted:                   "oklch(0.97 0 0)",
  mutedForeground:         "oklch(0.556 0 0)",
  accent:                  "oklch(0.97 0 0)",
  accentForeground:        "oklch(0.205 0 0)",
  destructive:             "oklch(0.577 0.245 27.325)",
  destructiveForeground:   "oklch(0.97 0.01 17)",
  border:                  "oklch(0.922 0 0)",
  input:                   "oklch(0.922 0 0)",
  ring:                    "oklch(0.708 0 0)",
  radius:                  "0.5rem",
  sidebar:                 "oklch(0.985 0 0)",
  sidebarForeground:       "oklch(0.145 0 0)",
  sidebarPrimary:          "oklch(0.205 0 0)",
  sidebarPrimaryForeground: "oklch(0.985 0 0)",
  sidebarAccent:           "oklch(0.97 0 0)",
  sidebarAccentForeground: "oklch(0.205 0 0)",
  sidebarBorder:           "oklch(0.922 0 0)",
  sidebarRing:             "oklch(0.708 0 0)",
}

export const themes = { dark, light } as const
