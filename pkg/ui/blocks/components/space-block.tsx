import React from 'react'

import { ldMerge, cn } from '../../util'

import type { Breakpoint } from '../../types'
import { SPACE_DEFAULTS , type TWSpaceUnit, type HeadingLevel} from '../def/space-block'
import type SpaceBlock from  '../def/space-block' 
import { ApplyTypography } from '../../primitives/index-blocks'

import type BlockComponentProps from './block-component-props'

const TAGS = [
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
] satisfies React.ElementType[]

const SpaceBlockComponent: React.FC<BlockComponentProps> = ({
  block,
  className=''
}) => {
  
  if (block && block.blockType !== 'space') {
    return <>space block required</>
  }

  const b = block as SpaceBlock

    // This code path should handle a undefined or empty sizes field.
  if (!b.level) {
    if (typeof b.sizes == 'number') {
      return <div className={cn(`invisible w-[1px] h-${b.sizes}`, className) } /> 
    }
    const _sizes: {
      [key in (Breakpoint)]?: TWSpaceUnit
    } = {}
    ldMerge(_sizes, SPACE_DEFAULTS, b.sizes)

    let clx = ''
    for (const [key, value] of Object.entries(_sizes)) {
          // ts brain fart!
        clx += `${key}:h-${value as TWSpaceUnit} `
    }   

    if (b.test) {
      console.log(clx)
    }

    return <div className={cn('invisible w-[1px] ' +  clx, className)} />
  }

  const Tag = TAGS[b.level]
  const heightClx = (b.level === (0 satisfies HeadingLevel as HeadingLevel)) ? 'h-4' : ''

  return (
    <ApplyTypography className={className}>
      <Tag className={'invisible m-0 ' + heightClx} >&nbsp;</Tag> 
    </ApplyTypography>
  )
}

export default SpaceBlockComponent
