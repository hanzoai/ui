import type { ImageDef } from '@hanzo/ui/types'
import type Product from './product'

interface Family {
  id: string            // LXB-AU-B
  title: string         // Minted Bar, Lux Elite Card
  titleShort?: string   // Elite
  parentTitle?: string  // Lux Gold, Lux Credit
  byline?: string       // literal text, or name of function on 'this' object that returns a string
  desc?: string
  img?: ImageDef, 
    // inbound to the service, they're Products 
    // when it's initialized, interally they become LineItems
    // always ok to cast up to LineItem thereafter
  products: Product[] 
}

export {
  type Family as default
}