import type { ImageDef, VideoDef } from '@hanzo/ui/types'

interface Product {
  id: string    // DB index // not a logical aspect of our domain.  may not be necessary at all
  sku: string   // human visible on orders etc.
  fullTitle?: string
  optionLabel: string
  categoryId: string  // skuPath, eg LXB-AU-B
  categoryTitle: string
  desc?: string
  price: number
  img?: ImageDef  // if undefined: (category's img exists) ? (use it) : (use generic placeholder)
  animation?: string  // spline scene url
  video?: VideoDef
}

export {
  type Product as default
}