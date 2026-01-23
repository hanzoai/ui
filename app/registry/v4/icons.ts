/**
 * Hanzo UI - Icon Library Registry
 *
 * Supported icon libraries for the design system.
 */

export interface IconLibrary {
  name: string
  title: string
  packages: string[]
  importPrefix: string
}

export const iconLibraries: Record<string, IconLibrary> = {
  lucide: {
    name: "lucide",
    title: "Lucide",
    packages: ["lucide-react"],
    importPrefix: "lucide-react",
  },
  hugeicons: {
    name: "hugeicons",
    title: "Hugeicons",
    packages: ["hugeicons-react"],
    importPrefix: "hugeicons-react",
  },
  tabler: {
    name: "tabler",
    title: "Tabler Icons",
    packages: ["@tabler/icons-react"],
    importPrefix: "@tabler/icons-react",
  },
  phosphor: {
    name: "phosphor",
    title: "Phosphor Icons",
    packages: ["@phosphor-icons/react"],
    importPrefix: "@phosphor-icons/react",
  },
  radix: {
    name: "radix",
    title: "Radix Icons",
    packages: ["@radix-ui/react-icons"],
    importPrefix: "@radix-ui/react-icons",
  },
  heroicons: {
    name: "heroicons",
    title: "Heroicons",
    packages: ["@heroicons/react"],
    importPrefix: "@heroicons/react/24/outline",
  },
}

export type IconLibraryName = keyof typeof iconLibraries
