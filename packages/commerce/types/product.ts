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

export {
  type Product as default
}