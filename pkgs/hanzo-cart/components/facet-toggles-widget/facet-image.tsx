import React from 'react'
import Image from 'next/image'

import type { FacetValueDesc } from '../../types'

const ICON_SIZE = 16
const SVG_MULT = 1.5

const FacetImage: React.FC<{
  facetValueDesc: FacetValueDesc
}> = ({
  facetValueDesc
}) => {
  if (!facetValueDesc.img) {
    return null
  }
  const isURL = typeof facetValueDesc.img === 'string'
  if (isURL) {
    return (
      <Image 
        src={facetValueDesc.img as string} 
        alt={`Toggle ${facetValueDesc.label}`} 
        className={'block mr-1 aspect-square rounded border border-muted-2'}
        width={ICON_SIZE}
        height={ICON_SIZE}
      />
    )
  }
  const svgStyle: any = { position: 'relative' }
  if (facetValueDesc.imgAR && facetValueDesc.imgAR < 1) {
    const w = ICON_SIZE * SVG_MULT
    svgStyle.top = (( 1 / facetValueDesc.imgAR - 1) * w) / 2
  }
  else if (facetValueDesc.imgAR && facetValueDesc.imgAR > 1) {
    const h = ICON_SIZE * SVG_MULT
    svgStyle.left = (((1 - facetValueDesc.imgAR) * h) / 2)
  }

  return (
    <span 
      className='block overflow-hidden ' 
      style={{
        color: 'inherit',
        width: ICON_SIZE * SVG_MULT, 
        height: ICON_SIZE * SVG_MULT,
      }} 
    >
      {React.cloneElement(facetValueDesc.img as React.ReactElement<any>, {
        width: (facetValueDesc.imgAR ?? 1) * ICON_SIZE * SVG_MULT, 
        height: SVG_MULT * ICON_SIZE,
        style: svgStyle
      })}
    </span>
  )
} 

export default FacetImage

