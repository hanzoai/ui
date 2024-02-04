import React from 'react'

import type * as B from '../def'

import CardBlockComponent from './card-block'
import HeadingBlockComponent from './heading-block'
import CTABlockComponent from './cta-block'
import SpaceBlockComponent from './space-block'
import ImageBlockComponent from './image-block'
import VideoBlockComponent from './video-block'
import AccordianBlockComponent from './accordian-block'
import GroupBlockComponent from './group-block'

const BlockFactory: React.FC<{
  block: B.Block
  className?: string
}> = ({
  block,
  className=''
}) => {

  switch (block.blockType) {
    case 'group': {
      return <GroupBlockComponent block={block} className={className} />
    }
    case 'card': {
      return <CardBlockComponent block={block} className={className} />
    }
    case 'cta': {
      return <CTABlockComponent block={block} itemClassName={className}/>
    }
    case 'heading': {
      return <HeadingBlockComponent block={block} className={className}/>
    }
    case 'space': {
      return <SpaceBlockComponent block={block} className={className} />
    }
    case 'video': {
      return <VideoBlockComponent block={block} className={className} />
    }
    case 'image':  {
      return <ImageBlockComponent block={block} className={className} />
    }
    case 'accordian': {
      return <AccordianBlockComponent block={block} className={className} />
    }
  }

  return <>unknown block type</>
}

const ContentComponent: React.FC<{
  blocks: B.Block | B.Block[] | undefined
}> = ({
  blocks
}) => {
  if (!blocks) return null
  if (Array.isArray(blocks)) {
    return (<>
      {blocks.map((block, index) => {
        return (<BlockFactory block={block} key={`content-block-${index}`}/>)
      })}
    </>)
  }
  return (
    (<BlockFactory block={blocks}/>)   
  )
}

export default ContentComponent
