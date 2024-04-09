import type { ReactNode } from 'react'

interface CategoryNode {
  skuToken: string             // a token in the sku
  label: string;
    /** 
     * If this node has subnodes, marks it as a "last user-visible" / "outermost" Category. 
     * Normally, a node without subnodes (one that has products and is a family), is by definition terminal. 
     * If it *has* subnodes, but its subNodes are to be treated as sibling families
     * of a Category, rather rather sub Categories, this is specified by setting terminal=true.
     * */
  terminal?: boolean;
  img? : string | ReactNode  // icon is required 
  imgAR? : number           // helps with svgs

  /** Short desc of what subNodes refer to.
   * For example, if this node's label is 'Lux Credit', 
   * it's subNodesLabel would be 'Level',
   * refering to membership 'levels' ('black', 'elite', etc)
  */
  subNodesLabel?: string   
  subNodes?: CategoryNode[]
}

type CategoryNodeRole = 
  'single-family' | 
  'family-in-multi-family' | 
  'multi-family' | 
  'non-outermost' 

  // Which facets tokens are 'on' at each level
type SelectedPaths = Record<number, string[]>

export type {
  CategoryNodeRole,
  CategoryNode,
  SelectedPaths
}