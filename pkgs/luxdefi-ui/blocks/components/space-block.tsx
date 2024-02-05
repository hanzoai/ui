import React from 'react'

import type { Block, SpaceBlock } from '../def'
import { ApplyTypography } from '../../primitives'
import type BlockComponentProps from './block-component-props'

const SpaceBlockComponent: React.FC<BlockComponentProps> = ({
  block,
  className=''
}) => {
  
  if (block && block.blockType !== 'space') {
    return <>space block required</>
  }

  const size = (block as SpaceBlock).level ?? 0

  let Tag: React.ElementType = 'div' // corresponds to 0

  switch(size) {
    case 1:
      Tag = 'h1'
    break
    case 2:
      Tag = 'h2'
    break
    case 3:
      Tag = 'h3'
    break
    case 4:
      Tag = 'h4'
    break
    case 5:
      Tag = 'h5'
    break
    case 6:
      Tag = 'h6'
    break
  }

  return (
    <ApplyTypography>
      <Tag className={`invisible m-0 ${Tag === 'div' ? 'h-[1px]' : ''} ${className}`} >&nbsp;</Tag> 
    </ApplyTypography>
  )
}

export default SpaceBlockComponent
