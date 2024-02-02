import React from 'react'

import type { Block, HeadingBlock } from '../def'

const HeadingBlockComponent: React.FC<{
  block: Block,
  className?: string
}> = ({
  block,
  className=''
}) => {

  if (block.blockType !== 'heading') {
    return <>heading block required</>
  }
  const heading = block as HeadingBlock

  let Tag: React.ElementType = 'h3' // default 
  let BylineTag: React.ElementType = 'h5' // default: two levels below main

  switch (heading.level) {
    case 0: {
      Tag = 'p'
      BylineTag = 'p'
    } break
    case 1: {
      Tag = 'h1'
      BylineTag = 'h3'
    } break
    case 2: {
      Tag = 'h2'
      BylineTag = 'h4'
    } break

    case 4: {
      Tag = 'h4'
      BylineTag = 'h6'
    } break
    case 5: {
      Tag = 'h5'
      BylineTag = 'p'
    } break
    case 6: {
      Tag = 'h6'
      BylineTag = 'p'
    } break
  }

  return (<>
    <Tag className={className}>{heading.heading}</Tag>
    {heading.byline && (<BylineTag >{heading.byline}</BylineTag>)}
  </>)
}

export default HeadingBlockComponent
