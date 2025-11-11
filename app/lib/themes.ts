import { baseColors } from "@/registry/base-colors"

// Real color schemes only (no grays, no hanzo)
const COLOR_SCHEMES = ["blue", "green", "neutral", "orange", "red", "rose", "violet", "yellow"]

export const THEMES = baseColors.filter((theme) =>
  COLOR_SCHEMES.includes(theme.name)
)
