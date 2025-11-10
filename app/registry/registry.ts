import { ai } from "./ai"
import { blocks } from "./blocks"
import { examples } from "./examples"
import { extended } from "./extended"
import { finance } from "./finance"
import { Registry } from "./schema"
import { ui } from "./ui"

export const registry: Registry = [
  ...ui,
  ...ai,
  ...finance,
  ...extended,
  ...examples,
  ...blocks,
]
