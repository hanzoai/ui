import type { ReactNode } from 'react'

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

export type {
  FacetValueDesc,
  FacetsDesc,
  FacetsValue
}