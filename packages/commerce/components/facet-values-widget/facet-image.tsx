import React from 'react'
import Image from 'next/image'

import type { FacetValueDesc } from '../../types'

const ICON_SIZE = 20

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

    // url
  if (typeof img === 'string') {
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
    // ReactNode
  return img as React.ReactNode
} 

export default FacetImage

