import type { LinkDef, ButtonDef } from '../../types'
import type Block from './block'

interface CTABlock extends Block {
  blockType: 'cta'
    // fill: fills the parent width with the elements
    // left / right: (>= md) left or right justify the elements (default is center)
    // mobile-2-columns: mobile defaults to rendering each element full width,
    //   on it's own line. This renders them in two columns instead. 
    // mobile-center-first-if-odd: if (mobile-2-columns) and length is odd, 
    //   default is to center last 
    // mobile-odd-full-width: fills the full two columns w the centered element
  specifiers?: string
  elements: (LinkDef | ButtonDef)[]
}

export {
  type CTABlock as default
}
