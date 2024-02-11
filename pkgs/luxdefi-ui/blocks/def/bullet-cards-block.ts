import type Block from './block'

import type { BulletItem, GridDef } from '../../types'

interface BulletCardsBlock extends Block {
  blockType: 'bullet-cards'
  grid: GridDef
  cards: BulletItem[]
    /** in px */
  iconSize?: number 
}

export {
  type BulletCardsBlock as default
}
