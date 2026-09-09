'use client'
import React, { useEffect, useState } from 'react'

import {
  Slider,
} from '@hanzo/ui'
const ItemCarouselSlider: React.FC<{
  clx?: string
  setScrollTo: (scrollTo: (index: number) => void) => void
  onIndexChange: (i: number) => void
  numStops: number
}> = ({
  clx='',
  setScrollTo,
  onIndexChange,
  numStops,
}) => {

  const [index, setIndex] = useState<number>(0)
  useEffect(() => { setScrollTo(setIndex) }, [setScrollTo])

  const onValueChange = (v: number[]) => { setIndex(v[0]); onIndexChange(v[0]) }

  return ( 
    <Slider 
      className={clx}   
      defaultValue={[0]} 
      min={0}
      max={numStops - 1} 
      step={1} 
      value={[index]}
      onValueChange={onValueChange}
    />
  )
}

export default ItemCarouselSlider
