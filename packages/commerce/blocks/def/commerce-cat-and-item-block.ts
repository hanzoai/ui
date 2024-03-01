import type  { Block } from '@hanzo/ui/blocks'

interface CommerceCatAndItemBlock extends Block {
  blockType: 'commerce-cat-and-item'
  parentPath: string        // SKU path of parent of Category ... eg, in Market, LXB-AU or LXB-AG.  Next level is Cat.
  defaultCatPath?: string   // SKU path of default Category... eg, in Market, LXB-AU-B (Minted Bar) 
}

export { type CommerceCatAndItemBlock as default }