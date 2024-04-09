import type { LineItem, ObsLineItemRef } from './line-item'

interface ItemSelector {
  items: LineItem[]
  selectedItemRef: ObsLineItemRef
  selectSku: (sku: string) => void 
}

type ItemSelectorOptions = {
    /** 
     * Whether the item label includes the Family name.
     * eg, 'Minted Bar, 1oz' vs '1oz'
     * default: false.
     */
  showFamily?: boolean
    /**
     * Show the current item quantity along with title and price.
     * default: false
     */
  showQuantity?: boolean   

    /** default: true */
  showPrice?: boolean

    /** default: false */
  imageButtons?: boolean  

    /** default: false */
  horizButtons?: boolean  
}

interface _ItemSelectorCompProps {
  clx?: string
  itemClx?: string
  soleItemClx?: string
    /** type-specific props for ItemSelector's.
     * eg, Carousel options.
     */
  ext?: any
    /** List selectors will scroll.  Used internally */
  scrollable: boolean
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