import type Block from "./block"
import type GridDef from "./grid-def"

interface GridBlock {
  blockType: 'grid'
  specifiers?: string
  grid: GridDef
  cells?: Block[] // if no cells, contents will be children
}

export {
  type GridBlock as default
}