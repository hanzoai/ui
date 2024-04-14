import type { ItemSelectorOptions } from './item-selector'

type SingleFamilySelector = 'buttons' | 'carousel' 
type MultiFamilySelector = 'family-carousel' | 'all-variants-carousel'

type MultiFamilySelectorOptions = {
      /** 
       * Show title of parent node of families.
       * eg,
       *   Lux Credit
       *   Black Card
       * 
       * vs just Black Card
       * 
       * ( parent CategoryNode.label)
       * 
       * (goes to one line if only one family)
       * default: true 
       * */ 
    showParentTitle?: boolean   

      /** parent CategoryNode.subNodesLabel 
       * 
       * default: 'none'
      */
    parentByline?: 'none' | 'own-line' | 'comma-sep' | 'colon-sep'  

      /** show horiz image buttons of
       * all sibling items below item info
       * default: true*/
    showItemSwatches?: boolean
}

interface SelectionUISpecifier {
  multiFamily?: {
    type: MultiFamilySelector
    selectorOptions?: MultiFamilySelectorOptions
    itemOptions?: ItemSelectorOptions
  }
  singleFamily?: {
    type: SingleFamilySelector
    options?: ItemSelectorOptions
  } 
}

export {
  type SelectionUISpecifier,
  type ItemSelectorOptions,
  type SingleFamilySelector,
  type MultiFamilySelector,
  type MultiFamilySelectorOptions
}