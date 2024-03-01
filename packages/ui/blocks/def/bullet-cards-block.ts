import type Block from './block'

import type { BulletItem, GridDef } from '../../types'

interface BulletCardsBlock extends Block {
  blockType: 'bullet-cards'
    /**
     * no-card-border
     * borders-muted-1 / borders-muted-3 
     * default: 2 
     */
  specifiers?: string
  grid: GridDef
  cards: BulletItem[]
    /** in px */
  iconSize?: number 
}

export {
  type BulletCardsBlock as default
}
