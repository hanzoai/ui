import React from 'react'
import Image from 'next/image'

import type { Dimensions } from '../../types'
import type { Block, ImageBlock } from '../def'
import { cn, constrain, containsToken } from '../../util'

const ImageBlockComponent: React.FC<{
  block: Block
  className?: string
  constraint?: Dimensions
}> = ({
  block,
  className='',
  constraint
}) => {
  
  if (block.blockType !== 'image') {
    return <>image block required</>
  }

  const {src, dim, props} = block as ImageBlock
  const toSpread: any = {}
  if (dim) {
    const dimCon = (constraint ? constrain(dim, constraint) : dim)
    toSpread.width = dimCon.w
    toSpread.height = dimCon.h
  } 

    // This are deprecated as props, and should be added as element styles instead.
    // https://nextjs.org/docs/messages/next-image-upgrade-to-13
  if (props?.objectFit) {
    toSpread.style = {
      objectFit: props.objectFit  
    }
    delete props.objectFit 
  }
  if (props?.objectPosition) {
    if (toSpread.style) {
      toSpread.style.objectPosition = props.objectPosition
    }
    else {
      toSpread.style = {
        objectPosition: props.objectPosition  
      }
    }
    delete props.objectPosition
  }

  return (props?.fill) ? (
    <div className='relative w-full h-full'>
      <Image src={src} {...toSpread} {...props} className={className}/>
    </div>
  ) : (
    <Image src={src} {...toSpread} {...props} className={className}/>   
  )
}

export default ImageBlockComponent

