import type { ReactNode } from 'react'

import type { ImageDef } from '@hanzo/ui/types'

interface Product {
  id: string    // DB index
  sku: string   // human visible on orders etc.
  title: string
  desc?: string
  price: number
    /** empty string means use categories image */
  img?: string | ImageDef
    /** eg, silver, vs individual products */  
}

interface Category {
  id: string
  title: string
  level?: number // for combining cat texts in meaningful ways
  desc?: string
  img?: string | ImageDef
}

interface TogglableCategory extends Category {
  get isOn(): boolean
  setOn(b: boolean): void
}

  // in the system, client code always 
  // goes through a list item, whether the product
  // is in the cart or not. SOmething is in the cart
  // when its quantity > 0.  That's the only difference
  // The ui, and other Cart code, reacts to 
  // changes in this quantity.
interface LineItem {
  product: Product

  /** all observable */
  get quantity(): number
  get canDecrement(): boolean
  get isInCart(): boolean

  increment(): void
  decrement(): void

  inCategory(id: string): boolean
}

interface CategoryFacetSpec {
  id: string
  label: string
  img?: string | ReactNode
  ar?: number // aspect ratio for svgs 
  tc?: TogglableCategory // transient, for convenience
}

export {
  type Product,
  type Category,
  type LineItem,
  type TogglableCategory,
  type CategoryFacetSpec,
}



