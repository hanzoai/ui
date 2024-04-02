import type { ImageDef } from '@hanzo/ui/types'
import type Product from './product'

interface Category {
  id: string            // LXB-AU-B
  title: string         // Minted Bar, Lux Elite Card
  titleShort?: string   // Elite
  parentTitle?: string  // Lux Gold, Lux Credit
  desc?: string
  img?: ImageDef, 
    // inbound they're Products and then interally they become LineItems
  products: Product[] 
}

export {
  type Category as default
}