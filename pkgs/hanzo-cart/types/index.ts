import type { ReactNode } from 'react'

interface Product {
  id: string    // DB index // not a logical aspect of our domain.  may not be necessary at all
  sku: string   // human visible on orders etc.
  title: string
  shortTitle?: string
  titleAsOption: string
  categoryId: string  // skuPath, eg LXB-AU-B
  desc?: string
  price: number
  img?: string  // if undefined: (category's img exists) ? (use it) : (use generic placeholder)
}

interface Category {
  id: string      // LXB-AU-B
  title: string   // Lux Gold, Minted Bar
  desc?: string
  img?: string 
    // inbound they're Products and then interally they become LineItems
  products: Product[] | LineItem[]
}


interface FacetValueDesc {
  value: string             // a token in the sku
  label: string
  img : string | ReactNode  // icon is required 
  imgAR? : number           // helps with svgs
}

/* *** FOR EXAMPLE **
{
  1: [ {
      token: 'AG',
      label: 'Silver',
      img: '/assets/img/cart/ui/facets/silver-swatch-200x200.png'
    },
    ... more FaceValues describing the "type" level (Silver, Gold)
  ],
  2 [
    {
      token: 'B'
      label: 'Minted Bar
    },
    ... more FaceValues describing the "form" level (Bar, Coin, )
  ]
}
*/
type FacetsDesc = Record<number, FacetValueDesc[]>

  // Which facets tokens are on at each level
type FacetsValue = Record<number, string[]>

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
}

export {
  type Product,
  type Category,
  type LineItem,
  type FacetsDesc,
  type FacetsValue,
  type FacetValueDesc,
}



