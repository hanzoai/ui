import React from 'react'

import { containsToken, cn } from '../../util'
import type { Block, BulletCardsBlock } from '../def'
import InlineIcon from '../../primitives/next/inline-icon'

import type BlockComponentProps from './block-component-props'
import GridBlockComponent from './grid-block'

const BulletCardsBlockComponent: React.FC<BlockComponentProps> = ({
  block,
  className='',
  agent
}) => {

  if (block.blockType !== 'bullet-cards') {
    return <>bullet cards block required</>
  }
  const b = block as BulletCardsBlock
  const specified = (s: string) => (containsToken(b.specifiers, s))
  
  const noBorder = specified('no-card-border') ? 'border-0' : 'md:border'
  const mobileTextXs = specified('mobile-small-text') ? 'text-xs' : 'text-sm'

  const borderclx = specified('border-muted-3') ? 
    'md:border-muted-3' 
    : 
    (specified('border-muted-1') ? 'md:border-muted-1' : 'md:border-muted-2')

  return (
    <GridBlockComponent block={{blockType: 'grid', grid: b.grid} as Block} className={className} agent={agent}>
    {b.cards.map((card, index) => (
      <div key={index} className={cn('px-0 sm:px-4 py-1 md:py-4 rounded-lg ' + 
        'flex flex-row justify-start items-center not-typography text-foreground',
        noBorder,
        borderclx
      )}>
        <InlineIcon icon={card.icon} size={b.iconSize ?? 28} agent={agent} className='shrink-0 mr-2 md:mr-4 '/>
        <p className={cn('m-0 sm:text-base', mobileTextXs)}>{card.text}</p>
      </div>
    ))}
    </GridBlockComponent>
  )
}

export default BulletCardsBlockComponent
