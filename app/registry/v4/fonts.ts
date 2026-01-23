/**
 * Hanzo UI - Font Registry
 *
 * Font definitions for the design system.
 */

import { type RegistryItem } from "./schema"

export const fonts: RegistryItem[] = [
  {
    name: "font-inter",
    type: "registry:file",
    title: "Inter",
    description: "A highly legible typeface designed for user interfaces.",
    dependencies: ["@fontsource-variable/inter"],
    files: [],
  },
  {
    name: "font-geist",
    type: "registry:file",
    title: "Geist",
    description: "Vercel's typeface designed for legibility and simplicity.",
    dependencies: ["geist"],
    files: [],
  },
  {
    name: "font-geist-mono",
    type: "registry:file",
    title: "Geist Mono",
    description: "Monospace version of Geist.",
    dependencies: ["geist"],
    files: [],
  },
  {
    name: "font-jetbrains-mono",
    type: "registry:file",
    title: "JetBrains Mono",
    description: "A typeface for developers.",
    dependencies: ["@fontsource-variable/jetbrains-mono"],
    files: [],
  },
  {
    name: "font-figtree",
    type: "registry:file",
    title: "Figtree",
    description: "A geometric sans serif with a warm personality.",
    dependencies: ["@fontsource-variable/figtree"],
    files: [],
  },
  {
    name: "font-outfit",
    type: "registry:file",
    title: "Outfit",
    description: "A clean geometric sans serif.",
    dependencies: ["@fontsource-variable/outfit"],
    files: [],
  },
  {
    name: "font-roboto",
    type: "registry:file",
    title: "Roboto",
    description: "Google's signature typeface.",
    dependencies: ["@fontsource-variable/roboto"],
    files: [],
  },
  {
    name: "font-source-sans",
    type: "registry:file",
    title: "Source Sans 3",
    description: "Adobe's open source humanist sans serif.",
    dependencies: ["@fontsource-variable/source-sans-3"],
    files: [],
  },
  {
    name: "font-ibm-plex-sans",
    type: "registry:file",
    title: "IBM Plex Sans",
    description: "IBM's corporate typeface.",
    dependencies: ["@fontsource-variable/ibm-plex-sans"],
    files: [],
  },
  {
    name: "font-fira-code",
    type: "registry:file",
    title: "Fira Code",
    description: "Monospace font with programming ligatures.",
    dependencies: ["@fontsource-variable/fira-code"],
    files: [],
  },
]

export type Font = (typeof fonts)[number]
export type FontName = Font["name"]
