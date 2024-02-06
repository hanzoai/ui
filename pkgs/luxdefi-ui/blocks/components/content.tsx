import React, { type ComponentType, type ReactNode} from 'react'

import type * as B from '../def'

import CardBlockComponent from './card-block'
import HeadingBlockComponent from './heading-block'
import CTABlockComponent from './cta-block'
import SpaceBlockComponent from './space-block'
import ImageBlockComponent from './image-block'
import VideoBlockComponent from './video-block'
import AccordianBlockComponent from './accordian-block'
import GroupBlockComponent from './group-block'

import type BlockComponentProps from './block-component-props'

const map = new Map<string, ComponentType<BlockComponentProps>>()
map.set('card', CardBlockComponent)
map.set('heading', HeadingBlockComponent)
map.set('cta', CTABlockComponent)
map.set('space', SpaceBlockComponent)
map.set('image', ImageBlockComponent)
map.set('video', VideoBlockComponent)
map.set('accordian', AccordianBlockComponent)
map.set('group', GroupBlockComponent)

const registerBlockType = (key: string, type: ComponentType<BlockComponentProps>): void => {
  map.set(key, type)
}

const renderBlock = (block: B.Block, className: string, agent: string, keyStr?: string): ReactNode => {
  if (block.blockType === 'element') {
    return (block as B.ElementBlock).element
  }
  const CompType = map.get(block.blockType)
  if (!CompType) return null
  return <CompType block={block} className={className} agent={agent} key={keyStr ?? ''} /> 
}

const ContentComponent: React.FC<{
  blocks: B.Block | B.Block[] | undefined
  className?: string
  agent?: string
}> = ({
  blocks,
  className='',
  agent=''
}) => {
  if (!blocks) return null
  if (Array.isArray(blocks)) {
    return (
      blocks.map((block, index) => (
        renderBlock(block, className, agent, `content-block-${block.blockType}-${index}`)
      ))
    )
  }
  return renderBlock(blocks, className, agent)
}

export {
  ContentComponent as default,
  registerBlockType
}
