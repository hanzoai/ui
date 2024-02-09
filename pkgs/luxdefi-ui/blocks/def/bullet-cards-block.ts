import type { Block, BulletItem, GridDef } from '.'

interface BulletCardsBlock extends Block {
  blockType: 'bullet-cards'
  grid: GridDef
  cards: BulletItem[]
  iconSize?: number // px
}

export {
  type BulletCardsBlock as default
}
