import type { LineItem, ObsLineItemRef } from './line-item'

interface ItemSelector {
  items: LineItem[]
  selectedItemRef: ObsLineItemRef
  selectSku: (sku: string) => void 
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
  scrollList: boolean
    /** 
     * Whether the item label includes the Category name.
     * eg, 'Minted Bar, 1oz' vs '1oz'
     * default: true in 'allVariants' mode and false otherwise.
     * This overrides
     */
  showCategory?: boolean
    /**
     * Show the current item quantity along with title and price.
     * default: false
     */
  showQuantity?: boolean    
}

type ItemSelectorCompProps = Omit<_ItemSelectorCompProps, 'scrollList'>

interface ItemSelectorProps extends 
  ItemSelector, _ItemSelectorCompProps {}

export {
  type ItemSelector,
  type ItemSelectorCompProps,
  type ItemSelectorProps
}