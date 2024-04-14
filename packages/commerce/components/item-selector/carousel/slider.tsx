'use client'
import React, { useEffect, useState } from 'react'

import { Slider } from '@hanzo/ui/primitives'

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
      thumbClx='w-8 border-muted border-2 bg-level-1 focus-visible:ring-0 focus-visible:ring-offset-0 transition-none' 
      trackBgClx='bg-level-3'
      rangeBgClx='bg-level-3'
      thumbSlidingClx='bg-muted-2' 
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
