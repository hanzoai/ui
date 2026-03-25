import { type RegistryItem } from "shadcn/schema"

<<<<<<< HEAD
export const fonts = [
  {
    name: "font-geist",
    title: "Geist",
    type: "registry:font",
    font: {
      family: "'Geist Variable', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "Geist",
    },
  },
  {
    name: "font-inter",
    title: "Inter",
    type: "registry:font",
    font: {
      family: "'Inter Variable', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "Inter",
    },
  },
  {
    name: "font-noto-sans",
    title: "Noto Sans",
    type: "registry:font",
    font: {
      family: "'Noto Sans Variable', sans-serif",
      provider: "google",
      variable: "--font-sans",
      import: "Noto_Sans",
    },
  },
  {
    name: "font-nunito-sans",
    title: "Nunito Sans",
    type: "registry:font",
    font: {
      family: "'Nunito Sans Variable', sans-serif",
      provider: "google",
      variable: "--font-sans",
      import: "Nunito_Sans",
    },
  },
  {
    name: "font-figtree",
    title: "Figtree",
    type: "registry:font",
    font: {
      family: "'Figtree Variable', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "Figtree",
    },
  },
  {
    name: "font-roboto",
    title: "Roboto",
    type: "registry:font",
    font: {
      family: "'Roboto', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "Roboto",
    },
  },
  {
    name: "font-raleway",
    title: "Raleway",
    type: "registry:font",
    font: {
      family: "'Raleway', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "Raleway",
    },
  },
  {
    name: "font-dm-sans",
    title: "DM Sans",
    type: "registry:font",
    font: {
      family: "'DM Sans', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "DM_Sans",
    },
  },
  {
    name: "font-public-sans",
    title: "Public Sans",
    type: "registry:font",
    font: {
      family: "'Public Sans', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "Public_Sans",
    },
  },
  {
    name: "font-outfit",
    title: "Outfit",
    type: "registry:font",
    font: {
      family: "'Outfit', sans-serif",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "Outfit",
    },
  },
  {
    name: "font-jetbrains-mono",
    title: "JetBrains Mono",
    type: "registry:font",
    font: {
      family: "'JetBrains Mono Variable', monospace",
      provider: "google",
      variable: "--font-sans",
      subsets: ["latin"],
      import: "JetBrains_Mono",
    },
  },
  {
    name: "font-geist-mono",
    title: "Geist Mono",
    type: "registry:font",
    font: {
      family: "'Geist Mono Variable', monospace",
      provider: "google",
      variable: "--font-mono",
      subsets: ["latin"],
      import: "Geist_Mono",
    },
  },
] satisfies RegistryItem[]
=======
import { FONT_DEFINITIONS, type FontDefinition } from "@/lib/font-definitions"

function createFontItem(definition: FontDefinition, role: "body" | "heading") {
  return {
    name:
      role === "body"
        ? `font-${definition.name}`
        : `font-heading-${definition.name}`,
    title: role === "body" ? definition.title : `${definition.title} (Heading)`,
    type: "registry:font",
    font: {
      family: definition.family,
      provider: definition.provider,
      variable:
        role === "body" ? definition.registryVariable : "--font-heading",
      ...(definition.weight ? { weight: [...definition.weight] } : {}),
      subsets: [...definition.subsets],
      import: definition.import,
      dependency: definition.dependency,
    },
  } satisfies RegistryItem
}

export const bodyFonts = FONT_DEFINITIONS.map((definition) =>
  createFontItem(definition, "body")
) satisfies RegistryItem[]

export const headingFonts = FONT_DEFINITIONS.map((definition) =>
  createFontItem(definition, "heading")
) satisfies RegistryItem[]

export const fonts = [...bodyFonts, ...headingFonts] satisfies RegistryItem[]
>>>>>>> shadcn/main
