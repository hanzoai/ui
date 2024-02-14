import type Block from "./block"
import type GridDef from "../../types/grid-def"

interface GridBlock {
  blockType: 'grid'
  specifiers?: string
  grid: GridDef
    /**
     * Ignored if children are supplied to the GridBlockComp
     */ 
  cells?: Block[] 
}

export {
  type GridBlock as default
}