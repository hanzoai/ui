import React from 'react'
import Image from 'next/image'

import type { Dimensions } from '../../types'
import type { ImageBlock } from '../def'
import { constrain } from '../../util'

import type BlockComponentProps from './block-component-props'


const ImageBlockComponent: React.FC<BlockComponentProps & {
  constraint?: Dimensions
}> = ({
  block,
  className='',
  agent,
  constraint
}) => {
  
  if (block.blockType !== 'image') {
    return <>image block required</>
  }

  const {src, alt, dim, props, fullWidthOnMobile} = block as ImageBlock
  const toSpread: any = {}
  if (dim && !!!props?.fill) {
    const dimCon = (constraint ? constrain(dim, constraint) : dim)
    toSpread.width = dimCon.w
    toSpread.height = dimCon.h
  } 

    // https://nextjs.org/docs/app/building-your-application/optimizing/images#responsive
  if (agent === 'phone' && fullWidthOnMobile) {
    const toSpread: any =  {
      style: {
        width: '100%',
        height: 'auto'
      },
      sizes: '100vw',
    }

    if (dim) {
      toSpread.width = dim.w
      toSpread.height = dim.h
    } 
  
    return (
      <div className='flex flex-col items-center w-full'>
        <Image src={src} alt={alt} {...toSpread} className={className}/>
      </div>
    )
  }

  return (props?.fill) ? (
    <div className='relative w-full h-full'>
      <Image src={src} alt={alt} {...toSpread} {...props} className={className}/>
    </div>
  ) : (
    <Image src={src} alt={alt} {...toSpread} {...props} className={className}/>   
  )
}

export default ImageBlockComponent

