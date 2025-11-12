import { baseColors } from "@/registry/base-colors"

// All Tailwind colors in hue order (matching /colors page)
const COLOR_SCHEMES = [
  "zen", // zinc renamed to zen (default Hanzo theme)
  "neutral",
  "stone",
  "slate",
  "gray",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]

export const THEMES = baseColors
  .map((theme) => {
    // Rename zinc to zen
    if (theme.name === "zinc") {
      return { ...theme, name: "zen", label: "Zen" }
    }
    return theme
  })
  .filter((theme) => COLOR_SCHEMES.includes(theme.name))
