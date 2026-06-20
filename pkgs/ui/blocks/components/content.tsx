import React, { ComponentType, type ReactNode} from 'react'

import type * as B from '../def'

import AccordianBlockComponent from './accordian-block'
import BulletCardsBlockComponent from './bullet-cards-block'
import CTABlockComponent from './cta-block'
import CardBlockComponent from './card-block'
import CarteBlancheBlockComponent from './carte-blanche-block'
import EnhHeadingBlockComponent from './enh-heading-block'
import HeadingBlockComponent from './heading-block'
import GroupBlockComponent from './group-block'
import GridBlockComponent from './grid-block'
import ImageBlockComponent from './image-block'
import SpaceBlockComponent from './space-block'
import VideoBlockComponent from './video-block'

import type BlockComponentProps from './block-component-props'

const map = new Map<string, ComponentType<BlockComponentProps>>()
map.set('accordian', AccordianBlockComponent)
map.set('bullet-cards', BulletCardsBlockComponent)
map.set('card', CardBlockComponent)
map.set('carte-blanche', CarteBlancheBlockComponent)
map.set('cta', CTABlockComponent)
map.set('heading', HeadingBlockComponent)
map.set('enh-heading', EnhHeadingBlockComponent as ComponentType<BlockComponentProps>)
map.set('space', SpaceBlockComponent)
map.set('image', ImageBlockComponent)
map.set('video', VideoBlockComponent)
map.set('group', GroupBlockComponent)
map.set('grid', GridBlockComponent)

const registerBlockType = (key: string, type: ComponentType<BlockComponentProps>): void => {
  map.set(key, type)
}

const renderBlock = (block: B.Block, className: string, agent?: string, keyStr?: string): ReactNode => {
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
  agent
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
