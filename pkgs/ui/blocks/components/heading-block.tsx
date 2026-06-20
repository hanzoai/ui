import React from 'react'

import type { HeadingBlock } from '../def'
import { ApplyTypography } from '../../primitives/index-blocks'

import type BlockComponentProps from './block-component-props'

const HeadingBlockComponent: React.FC<BlockComponentProps> = ({
  block,
  className=''
}) => {

  if (block.blockType !== 'heading') {
    return <>heading block required</>
  }
  const heading = block as HeadingBlock

  let Tag: React.ElementType  
  let BylineTag: React.ElementType | undefined = undefined 
  
  switch (heading.bylineLevel) {
    case 0: {
      BylineTag = 'p'
    } break
    case 1: {
      BylineTag = 'h1'
    } break
    case 2: {
      BylineTag = 'h2'
    } break
    case 3: {
      BylineTag = 'h3'
    } break
    case 4: {
      BylineTag = 'h4'
    } break
    case 5: {
      BylineTag = 'h5'
    } break
    case 6: {
      BylineTag = 'h6'
    } break
  }
    // bylineLevel default is two levels below the main heading
  switch (heading.level) {
    case 0: {
      Tag = 'p'
      BylineTag = BylineTag ?? 'p'
    } break
    case 1: {
      Tag = 'h1'
      BylineTag = BylineTag ?? 'h3'
    } break
    case 2: {
      Tag = 'h2'
      BylineTag = BylineTag ?? 'h4'
    } break
    // 3 is default
    case 4: {
      Tag = 'h4'
      BylineTag = BylineTag ?? 'h6'
    } break
    case 5: {
      Tag = 'h5'
      BylineTag = BylineTag ?? 'p'
    } break
    case 6: {
      Tag = 'h6'
      BylineTag = BylineTag ?? 'p'
    } break
    default: {
      Tag = 'h3'
      BylineTag = BylineTag ?? 'h5'
    }
  }

    // Had to do this way, since tw typo plugin does support overrding typo styling wiithout .not-typography
  return (
    <ApplyTypography className={className}>
      <Tag >{heading.heading}</Tag>
      {heading.spaceBetween && <div className={'w-[1px] ' + `h-${heading.spaceBetween}`} />}
      {heading.byline && (<BylineTag>{heading.byline}</BylineTag>)}
      {heading.spaceAfter && <div className={'w-[1px] ' + `h-${heading.spaceAfter}`} />}
    </ApplyTypography>
  )
}

export default HeadingBlockComponent
