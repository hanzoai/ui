import type { ReactNode } from 'react'

interface CategoryNode {
  skuToken: string             // a token in the sku
  label: string;
    /** 
     * Explicitly marks this node as a "last user-visible" / "outermost" Category. 
     * Normally, a node is "outermost" when it has no subnodes 
     * (and thus is a family with products -- "single-family")
     * But if it *has* subnodes, and its subNodes are actually sibling families
     * of a Category, it must be marked as "outermost" ("multi-family")
     * */
  outermost?: boolean;
  img? : string | ReactNode  // icon is required 
  imgAR? : number           // helps with svgs

  /** 
   * One word prompt that describes the 'meaning' of 
   * the subnodes. 
   * For example, if a node is 'Lux Credit', 
   * it's subNodesLabel might be 'Level', so some UI's
   * might be configured to render 'Level: Black'
   * 
   * or something like...
   * 
   * <Tabs title={parentNode.label + ': ' + parentNode.subNodesLabel} values={families.map((f) => (f.shortName))} />
   * 
   * ...which renders
   *        
   * Lux Credit Levels:
   * Black   Elite   Founder   Sovereign 
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