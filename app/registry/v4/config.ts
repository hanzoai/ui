/**
 * Hanzo UI - Design System Configuration
 *
 * Central configuration for the design system, including:
 * - Base (radix vs base-ui)
 * - Style (vega, nova, maia, lyra, mira, hanzo)
 * - Theme (color scheme)
 * - Icon library
 * - Font
 */

import { z } from "zod"

import { BASES, type Base, type BaseName } from "./bases"
import { STYLES, type Style, type StyleName } from "./styles"
import { THEMES, type Theme, type ThemeName } from "./themes"
import { BASE_COLORS, type BaseColor, type BaseColorName } from "./base-colors"
import { fonts } from "./fonts"
import { iconLibraries, type IconLibrary, type IconLibraryName } from "./icons"

// Re-exports
export { BASES, type Base, type BaseName }
export { STYLES, type Style, type StyleName }
export { THEMES, type Theme, type ThemeName }
export { BASE_COLORS, type BaseColor, type BaseColorName }
export { fonts }
export { iconLibraries, type IconLibrary, type IconLibraryName }

// Derive font values from registry fonts
const fontValues = fonts.map((f) => f.name.replace("font-", "")) as [
  string,
  ...string[],
]

export type FontValue = (typeof fontValues)[number]

// Menu accent options
export const MENU_ACCENTS = [
  { value: "subtle", label: "Subtle" },
  { value: "bold", label: "Bold" },
] as const

export type MenuAccent = (typeof MENU_ACCENTS)[number]
export type MenuAccentValue = MenuAccent["value"]

// Menu color options
export const MENU_COLORS = [
  { value: "default", label: "Default" },
  { value: "inverted", label: "Inverted" },
] as const

export type MenuColor = (typeof MENU_COLORS)[number]
export type MenuColorValue = MenuColor["value"]

// Radius options
export const RADII = [
  { name: "default", label: "Default", value: "" },
  { name: "none", label: "None", value: "0" },
  { name: "small", label: "Small", value: "0.45rem" },
  { name: "medium", label: "Medium", value: "0.625rem" },
  { name: "large", label: "Large", value: "0.875rem" },
] as const

export type Radius = (typeof RADII)[number]
export type RadiusValue = Radius["name"]

// Design system config schema
export const designSystemConfigSchema = z
  .object({
    base: z.enum(BASES.map((b) => b.name) as [BaseName, ...BaseName[]]),
    style: z.enum(STYLES.map((s) => s.name) as [StyleName, ...StyleName[]]),
    iconLibrary: z.enum(
      Object.keys(iconLibraries) as [IconLibraryName, ...IconLibraryName[]]
    ),
    baseColor: z
      .enum(
        BASE_COLORS.map((c) => c.name) as [BaseColorName, ...BaseColorName[]]
      )
      .default("neutral"),
    theme: z.enum(THEMES.map((t) => t.name) as [ThemeName, ...ThemeName[]]),
    font: z.enum(fontValues).default("inter"),
    item: z.string().optional(),
    menuAccent: z
      .enum(
        MENU_ACCENTS.map((a) => a.value) as [
          MenuAccentValue,
          ...MenuAccentValue[],
        ]
      )
      .default("subtle"),
    menuColor: z
      .enum(
        MENU_COLORS.map((m) => m.value) as [MenuColorValue, ...MenuColorValue[]]
      )
      .default("default"),
    radius: z
      .enum(RADII.map((r) => r.name) as [RadiusValue, ...RadiusValue[]])
      .default("default"),
    template: z.enum(["next", "start", "vite"]).default("next").optional(),
  })
  .superRefine((data, ctx) => {
    const availableThemes = getThemesForBaseColor(data.baseColor)
    if (!availableThemes.some((t) => t.name === data.theme)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Theme "${data.theme}" is not available for base color "${data.baseColor}"`,
        path: ["theme"],
      })
    }
  })

export type DesignSystemConfig = z.infer<typeof designSystemConfigSchema>

// Default configuration
export const DEFAULT_CONFIG: DesignSystemConfig = {
  base: "radix",
  style: "hanzo",
  baseColor: "neutral",
  theme: "hanzo",
  iconLibrary: "lucide",
  font: "inter",
  item: "Item",
  menuAccent: "subtle",
  menuColor: "default",
  radius: "default",
  template: "next",
}

// Presets
export type Preset = {
  name: string
  title: string
  description: string
} & DesignSystemConfig

export const PRESETS: Preset[] = [
  // Hanzo presets
  {
    name: "hanzo-default",
    title: "Hanzo Default",
    description: "Dark-first design for developer tools",
    base: "radix",
    style: "hanzo",
    baseColor: "neutral",
    theme: "hanzo",
    iconLibrary: "lucide",
    font: "inter",
    item: "Item",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
  },
  {
    name: "hanzo-ai",
    title: "Hanzo AI",
    description: "Optimized for AI interfaces",
    base: "radix",
    style: "hanzo",
    baseColor: "neutral",
    theme: "violet",
    iconLibrary: "lucide",
    font: "inter",
    item: "Item",
    menuAccent: "bold",
    menuColor: "default",
    radius: "medium",
  },
  // Radix presets
  {
    name: "radix-vega",
    title: "Vega (Radix)",
    description: "Vega / Lucide / Geist Sans",
    base: "radix",
    style: "vega",
    baseColor: "neutral",
    theme: "neutral",
    iconLibrary: "lucide",
    font: "geist",
    item: "Item",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
  },
  {
    name: "radix-nova",
    title: "Nova (Radix)",
    description: "Nova / Hugeicons / Inter",
    base: "radix",
    style: "nova",
    baseColor: "neutral",
    theme: "neutral",
    iconLibrary: "hugeicons",
    font: "inter",
    item: "Item",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
  },
  // Base UI presets
  {
    name: "base-vega",
    title: "Vega (Base)",
    description: "Vega / Lucide / Inter",
    base: "base",
    style: "vega",
    baseColor: "neutral",
    theme: "neutral",
    iconLibrary: "lucide",
    font: "inter",
    item: "Item",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
  },
  {
    name: "base-nova",
    title: "Nova (Base)",
    description: "Nova / Hugeicons / Inter",
    base: "base",
    style: "nova",
    baseColor: "neutral",
    theme: "neutral",
    iconLibrary: "hugeicons",
    font: "inter",
    item: "Item",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
  },
]

// Helper functions
export function getThemesForBaseColor(baseColorName: string) {
  const baseColorNames = BASE_COLORS.map((bc) => bc.name)

  return THEMES.filter((theme) => {
    if (theme.name === baseColorName) {
      return true
    }
    return !baseColorNames.includes(theme.name)
  })
}

export function getBase(name: BaseName) {
  return BASES.find((base) => base.name === name)
}

export function getStyle(name: StyleName) {
  return STYLES.find((style) => style.name === name)
}

export function getTheme(name: ThemeName) {
  return THEMES.find((theme) => theme.name === name)
}

export function getBaseColor(name: BaseColorName) {
  return BASE_COLORS.find((color) => color.name === name)
}

export function getIconLibrary(name: IconLibraryName) {
  return iconLibraries[name]
}

// Build registry theme from config
export function buildRegistryTheme(config: DesignSystemConfig) {
  const baseColor = getBaseColor(config.baseColor)
  const theme = getTheme(config.theme)

  if (!baseColor || !theme) {
    throw new Error(
      `Base color "${config.baseColor}" or theme "${config.theme}" not found`
    )
  }

  // Merge base color and theme CSS vars
  const lightVars: Record<string, string> = {
    ...(baseColor.cssVars?.light as Record<string, string>),
    ...(theme.cssVars?.light as Record<string, string>),
  }
  const darkVars: Record<string, string> = {
    ...(baseColor.cssVars?.dark as Record<string, string>),
    ...(theme.cssVars?.dark as Record<string, string>),
  }
  const themeVars: Record<string, string> = {}

  // Apply menu accent transformation
  if (config.menuAccent === "bold") {
    lightVars.accent = lightVars.primary
    lightVars["accent-foreground"] = lightVars["primary-foreground"]
    darkVars.accent = darkVars.primary
    darkVars["accent-foreground"] = darkVars["primary-foreground"]
    lightVars["sidebar-accent"] = lightVars.primary
    lightVars["sidebar-accent-foreground"] = lightVars["primary-foreground"]
    darkVars["sidebar-accent"] = darkVars.primary
    darkVars["sidebar-accent-foreground"] = darkVars["primary-foreground"]
  }

  // Apply radius transformation
  if (config.radius && config.radius !== "default") {
    const radius = RADII.find((r) => r.name === config.radius)
    if (radius && radius.value) {
      lightVars.radius = radius.value
    }
  }

  return {
    name: `${config.baseColor}-${config.theme}`,
    type: "registry:theme" as const,
    cssVars: {
      theme: Object.keys(themeVars).length > 0 ? themeVars : undefined,
      light: lightVars,
      dark: darkVars,
    },
  }
}

// Build registry base from config
export function buildRegistryBase(config: DesignSystemConfig) {
  const baseItem = getBase(config.base)
  const iconLibraryItem = getIconLibrary(config.iconLibrary)

  if (!baseItem || !iconLibraryItem) {
    throw new Error(
      `Base "${config.base}" or icon library "${config.iconLibrary}" not found`
    )
  }

  const registryTheme = buildRegistryTheme(config)

  // Build dependencies
  const dependencies = [
    "class-variance-authority",
    "tw-animate-css",
    ...(baseItem.dependencies ?? []),
    ...iconLibraryItem.packages,
  ]

  const registryDependencies = ["utils"]

  if (config.font) {
    registryDependencies.push(`font-${config.font}`)
  }

  return {
    name: `${config.base}-${config.style}`,
    extends: "none",
    type: "registry:base" as const,
    config: {
      style: `${config.base}-${config.style}`,
      iconLibrary: iconLibraryItem.name,
      menuColor: config.menuColor,
      menuAccent: config.menuAccent,
      tailwind: {
        baseColor: config.baseColor,
      },
    },
    dependencies,
    registryDependencies,
    cssVars: registryTheme.cssVars,
    css: {
      '@import "tw-animate-css"': {},
      "@layer base": {
        "*": { "@apply border-border outline-ring/50": {} },
        body: { "@apply bg-background text-foreground": {} },
      },
    },
  }
}
