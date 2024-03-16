import type Category from './category'
import type { ObsLineItemRef } from './line-item'

interface ItemSelector {
  category: Category
  selectedItemRef: ObsLineItemRef
  selectSku: (sku: string) => void 
  showPrice?: boolean       // true by default
  showQuantity?: boolean    // true by default (not impl)
}

export {
  type ItemSelector as default
}