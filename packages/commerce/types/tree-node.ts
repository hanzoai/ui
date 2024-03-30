import type { ReactNode } from 'react'

interface ProductTreeNode {
  skuToken: string             // a token in the sku
  label: string
  img? : string | ReactNode  // icon is required 
  imgAR? : number           // helps with svgs

  /** Short desc of what subNodes refer to.
   * For example, if this node's label is 'Lux Credit', 
   * it's subNodesLabel would be 'Level',
   * refering to membership 'levels' ('black', 'elite', etc)
  */
  subNodesLabel?: string   
  subNodes?: ProductTreeNode[]
}

  // Which facets tokens are 'on' at each level
type SelectedPaths = Record<number, string[]>

export type {
  ProductTreeNode,
  SelectedPaths
}