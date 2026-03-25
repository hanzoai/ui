import { THEMES } from "@/registry/themes"

export const BASE_COLORS = THEMES.filter((theme) =>
<<<<<<< HEAD
  ["neutral", "stone", "zinc", "gray"].includes(theme.name)
=======
  ["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"].includes(
    theme.name
  )
>>>>>>> shadcn/main
)

export type BaseColor = (typeof BASE_COLORS)[number]
