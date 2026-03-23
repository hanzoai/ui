/**
 * Tamagui theme tokens for Hanzo.
 *
 * Maps Hanzo design tokens to Tamagui's createTokens format.
 *
 * Usage:
 *   import { tamaguiTokens } from "@hanzo/tokens/tamagui"
 *   const config = createTamagui({ tokens: tamaguiTokens, ... })
 */

import { colors, zinc } from "./colors"
import { spacingPx } from "./spacing"
import { radiiPx } from "./radii"
import { fontSizePx } from "./typography"
import { dark, light } from "./themes"

export const tamaguiTokens = {
  color: {
    ...colors,
    ...Object.fromEntries(
      Object.entries(zinc).map(([k, v]) => [`zinc${k}`, v])
    ),
  },
  space: spacingPx,
  size: spacingPx,
  radius: radiiPx,
  fontSize: fontSizePx,
} as const

export const tamaguiDarkTheme = {
  background: dark.background,
  color: dark.foreground,
  cardBackground: dark.card,
  cardColor: dark.cardForeground,
  borderColor: dark.border,
  shadowColor: dark.ring,
  primary: dark.primary,
  primaryForeground: dark.primaryForeground,
  secondary: dark.secondary,
  secondaryForeground: dark.secondaryForeground,
  muted: dark.muted,
  mutedForeground: dark.mutedForeground,
  accent: dark.accent,
  accentForeground: dark.accentForeground,
  destructive: dark.destructive,
  destructiveForeground: dark.destructiveForeground,
} as const

export const tamaguiLightTheme = {
  background: light.background,
  color: light.foreground,
  cardBackground: light.card,
  cardColor: light.cardForeground,
  borderColor: light.border,
  shadowColor: light.ring,
  primary: light.primary,
  primaryForeground: light.primaryForeground,
  secondary: light.secondary,
  secondaryForeground: light.secondaryForeground,
  muted: light.muted,
  mutedForeground: light.mutedForeground,
  accent: light.accent,
  accentForeground: light.accentForeground,
  destructive: light.destructive,
  destructiveForeground: light.destructiveForeground,
} as const
