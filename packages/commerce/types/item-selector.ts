import type { LineItem, ObsLineItemRef } from './line-item'

interface ItemSelector {
  items: LineItem[]
  selectedItemRef: ObsLineItemRef
  selectSku: (sku: string) => void 
  showPrice?: boolean       // true by default
  showQuantity?: boolean    // false by default (not impl)
}

interface ItemSelectorProps extends ItemSelector {
  clx?: string
  soleItemClx?: string
  itemClx?: string
  ext?: any
}

export {
  type ItemSelector,
  type ItemSelectorProps
}