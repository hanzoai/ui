
import type Block from './block'
import type CTABlock from './cta-block'
import type EnhHeadingBlock from './enh-heading-block'

interface CarteBlancheBlock extends Block {
  blockType: 'carte-blanche'
    // big-padding
    // no-outer-borders
    // no-internal-borders
    // style-ghost (no-internal-borders, no outer border, no padding)
  specifiers?: string 
  topContent?: Block[] 
  heading?: EnhHeadingBlock
  content?: Block[] 
  cta?: CTABlock
}

export {
  type CarteBlancheBlock as default
}
