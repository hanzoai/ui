import type { LineItem, ObsLineItemRef } from './line-item'

interface ItemSelector {
  items: LineItem[]
  selectedItemRef: ObsLineItemRef
  selectSku: (sku: string) => void 
}

  /** default: 'text' */
type ItemButton = 'text' | 'image-and-text' | 'image' 

  // NOTE: if a field is added here, it should also
  // be added to util/item-selector-options-accessor.ts
type ItemSelectorOptions = {

    /** 
     * default: short
     * 'short': product.shortTitle if defined
     * 'long': always us product.title, even if .shortTitle is defined
     * 'none': do not show title AND BYLINE
     * 
     * (NOTE: *not* the same as buttonType = 'none')
     */
  familyTitle?: 'none' | 'long' | 'short'

    /** only if title shown 
     * default: false */
  showFamilyByline?: boolean

    /** 
     * Whether the item label includes the Family name.
     * eg, 'Minted Bar, 1oz' vs '1oz'
     * default: false.
     */
  showFamilyInOption?: boolean
    /** default: true if it exists */
  showByline?: boolean

    /** default: true */
  showPrice?: boolean

    /**
     * Show the current item quantity along with title and price.
     * default: false
     */
  showQuantity?: boolean   

  buttonType?: ItemButton  

    /** (button selector only) default: false */
  horizButtons?: boolean  

    /** (carousel selector only) 
     * affects sort.  See below.
     * default: false */
  showSlider?: boolean

    /** 
     * Sort by cost. 
     * If it's a carousel selector and 'showSlider' is true, 
     * defaults to 'asc', unless another value is explicitly specified.
     * Otherwise, defaults to 'none' 
     * */
  sort?: 'none' | 'asc' | 'desc' 
}

interface _ItemSelectorCompProps {
  clx?: string
  itemClx?: string
  soleItemClx?: string
    /** type-specific props for ItemSelector's.
     * eg, Carousel options.
     */
  ext?: any
    /** List selectors will scroll.  
     * Used internally
     * default: false */
  scrollable? : boolean
  options?: ItemSelectorOptions

  mobile?: boolean 
}

type ItemSelectorCompProps = Omit<_ItemSelectorCompProps, 'scrollable'>

interface ItemSelectorProps extends 
  ItemSelector, _ItemSelectorCompProps {}

export {
  type ItemSelector,
  type ItemSelectorCompProps,
  type ItemSelectorOptions,
  type ItemSelectorProps
}