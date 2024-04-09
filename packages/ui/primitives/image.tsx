import React from 'react'
import NextImage from 'next/image'

import type { ImageDef, Dimensions } from '../types'
import { constrain, cn } from '../util'

const Image: React.FC<{
  def: ImageDef
  constrainTo?: Dimensions
  fullWidth?: boolean
  className?: string
  preload?: boolean
}> = ({
  def,
  constrainTo,
  fullWidth=false,
  className='',
  preload=false
}) => {
  
  const {
    src, 
    alt: _alt, 
    dim, 
    sizes,
    svgFillClass: _svgFillClass,
  } = def

  const toSpread: any = {}
  if (fullWidth) {
    toSpread.style = {
      width: '100%',
      height: 'auto',
    }
    if (constrainTo) {
      toSpread.style.maxWidth = constrainTo.w  
      toSpread.style.maxHeight = constrainTo.h  
    }
  }
  else {
    const resolved = constrainTo ? constrain(dim, constrainTo) : dim
    toSpread.width = resolved.w
    toSpread.height = resolved.h
  } 

  if (sizes) {
    toSpread.sizes = sizes
  }

    // Note: cannot be spread (a Next thing)
  let alt: string
  if (_alt) {
    alt = _alt
  }
  else {
    const tokens = src.split('/')
      // Something remotely meaningful
    alt = (tokens.length > 0) ? tokens[tokens.length - 1] : src
  }

  const svgFillClass = _svgFillClass ?? ''

  return (fullWidth) ? (
    <div className='relative flex flex-col items-center w-full'>
      <NextImage src={src} alt={alt} {...toSpread} priority={preload} loading={preload ? 'eager' : 'lazy'} className={cn(svgFillClass, className)}/>
    </div>
  ) : (
    <NextImage src={src} alt={alt} {...toSpread} priority={preload} loading={preload ? 'eager' : 'lazy'} className={cn(svgFillClass, className)}/>   
  )
}

export default Image

