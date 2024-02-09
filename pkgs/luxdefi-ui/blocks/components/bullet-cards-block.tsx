import React from 'react'

import type BlockComponentProps from './block-component-props'
import GridBlockComponent from './grid-block'
import type { Block, BulletCardsBlock } from '../def'
import InlineIcon from './inline-icon'

const BulletCardsBlockComponent: React.FC<BlockComponentProps> = ({
  block,
  className='',
  agent
}) => {

  if (block.blockType !== 'bullet-cards') {
    return <>bullet cards block required</>
  }
  const b = block as BulletCardsBlock

  return (
    <GridBlockComponent block={{blockType: 'grid', grid: b.grid} as Block} className={className} agent={agent}>
    {b.cards.map((card, index) => (
      <div key={index} className='md:border md:border-muted-2 rounded px-6 py-1 md:py-4 flex flex-row justify-start items-center not-typography'>
        <InlineIcon icon={card.icon} size={b.iconSize ?? 28} agent={agent}/>
        <p className='m-0'>{card.text}</p>
      </div>
    ))}
    </GridBlockComponent>
  )
}

export default BulletCardsBlockComponent
