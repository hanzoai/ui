import type Product from './product'

  // Client code always 
  // has a LineItem, whether the Product
  // is in the cart or not. Something is in the cart
  // when its quantity > 0.  That's the only difference.
  // The ui, and as well as some Cart state, reacts to 
  // changes in this quantity.

  // It could have more accurately been named
  // 'QuantifiedProduct' but that sucked.
interface LineItem extends Product {

  /** all observable */
  get quantity(): number
  get canDecrement(): boolean
  get isInCart(): boolean

  increment(): void
  decrement(): void

  get title(): string
}

interface ObsLineItemRef {
  get item(): LineItem | undefined
}

export type { LineItem, ObsLineItemRef}
