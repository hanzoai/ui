import type Product from './product'

interface Category {
  id: string      // LXB-AU-B
  title: string   // Lux Gold, Minted Bar
  desc?: string
  img?: string 
    // inbound they're Products and then interally they become LineItems
  products: Product[] 
}

export {
  type Category as default
}