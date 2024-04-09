import type { ItemSelectorOptions } from './item-selector'
type SelectorType = 'buttons' | 'carousel' 

interface FamilyCarouselSlideOptions extends ItemSelectorOptions {
    /** 
     * default: short
     * 'short': product.shortTitle if defined
     * 'long': always us product.title, even if .shortTitle is defined
     * 'none': do not show title AND BYLINE
     */
  title?: 'none' | 'long' | 'short'
    /** default: true */ 
  showByline?: boolean
}

interface SelectionUISpecifier {
  multiFamily?: {
    familySelector: 'carousel'
      /** default: true */ 
    showParentTitle: boolean 
    slide: {
      type: 'buttons'
      options?: FamilyCarouselSlideOptions
    }
  }
  singleFamily?: {
    type: SelectorType
    options?: ItemSelectorOptions
  } 
}

export {
  type SelectionUISpecifier,
  type FamilyCarouselSlideOptions,
  type SelectorType
}