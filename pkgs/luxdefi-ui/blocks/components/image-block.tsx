import React from 'react'
import Image from 'next/image'

import type { Dimensions } from '../../types'
import type { ImageBlock } from '../def'
import { constrain, containsToken, cn } from '../../util'

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

  const {src, alt, dim, props, fullWidthOnMobile, specifiers} = block as ImageBlock
  const toSpread: any = {}
  if (dim && !!!props?.fill) {
    const dimCon = (constraint ? constrain(dim, constraint) : dim)
    toSpread.width = dimCon.w
    toSpread.height = dimCon.h
  } 

    // https://nextjs.org/docs/app/building-your-application/optimizing/images#responsive
  if (agent === 'phone' ) {
    if (fullWidthOnMobile) {
      const toSpread: any =  {
        style: {
          width: '100%',
          height: 'auto'
        },
        sizes: '100vw',
      }
        // only for aspect ratio and to satisfy parser
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
    else if (!containsToken(specifiers, 'mobile-no-scale')) {
      if (props?.style?.width === 'auto' && typeof props.style.height === 'number' ) {
        props.style.height = props.style.height *.75 
      }
      else if (props?.style?.height === 'auto' && typeof props?.style?.width === 'number' ) {
        props.style.width = props.style.width *.75 
      }
      else if (props?.style && !props?.style.width) {
        if (dim) {
          toSpread.width = +dim.w * .75
          toSpread.height = +dim.h * .75
        } 
      }
    }
  }

  const right = containsToken(specifiers, 'right')
  const center = containsToken(specifiers, 'center')

  const alignSelfClx = right ? 'self-end' : (center ? 'self-center' : 'self-start')

  return (props?.fill) ? (
    <div className='relative w-full h-full'>
      <Image src={src} alt={alt} {...toSpread} {...props} className={className}/>
    </div>
  ) : (
    <Image src={src} alt={alt} {...toSpread} {...props} className={cn(alignSelfClx, className)}/>   
  )
}

export default ImageBlockComponent

