import React from 'react'
import Image from 'next/image'

import type { FacetValueDesc } from '../../types'

const ICON_SIZE = 20
const SVG_MULT = 1.5

const FacetImage: React.FC<{
  facetValueDesc: FacetValueDesc
}> = ({
  facetValueDesc
}) => {
  const {
    img,
    imgAR: ar,
    label
  } = facetValueDesc


  if (!img) {
    return null
  }
  const isURL = typeof img === 'string'
  if (isURL) {
    return (
      <Image 
        src={img as string} 
        alt={`Toggle ${label}`} 
        className={'block mr-1 '} 
        width={ar ?  ar * ICON_SIZE : ICON_SIZE}
        height={ICON_SIZE}
      />
    )
  }

  return img as React.ReactNode

    // Otherwise, assume it's a ReactNode of an imported SVG

    // If it's not square, center it in the appropriate dimension
    /*
  const svgStyle: any = { position: 'relative' }
  if (ar) {
    if (ar < 1) {
      const w = ICON_SIZE * SVG_MULT
      svgStyle.top = (( 1 / ar - 1) * w) / 2
    }
    else if (ar > 1) {
      const h = ICON_SIZE * SVG_MULT
      svgStyle.left = (((1 - ar) * h) / 2)
    }
  }

  return (
    <span 
      className='flex justify-center items-center overflow-hidden ' 
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
  */
} 

export default FacetImage

