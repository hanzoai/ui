import type Icon from '../../types/icon'
import type Block from './block'

  // level is heading tag level. 1 renders as <h1>, etc... 0 renders as <p>
  //
  // mb: is bottom margin in tw units. 'mb-1' produces 0.25rem, so a value of 4 would produce 1rem
  //    These are dynamically generated from a template string. mb-1 --> mb-12 have been safelisted.
  //    Any higher values used would have to explicitly safelisted in tailwind config. 
  //    The margin will only be applied if the next element down is present. 
  //    (eg, heading mb applies only if there is a byline.) 

interface EnhHeadingBlock extends Block {
  blockType: 'enh-heading'
    // tbd: icon-w-heading (if preheading is present), 
    // tbd: icon-w-byline (if preheading and heading is present), 
    // tbd: icon-above: above first element
    // tbd: icon-to-right: to right of corresponding element or right justified if 'icon-above'
    // mobile-heading-centered
    // left / right / center for preheading and heading (byline stays left)
    // byline-left / byline-right / byline-center
    // preheading-heading-font
    // respect-case: no all caps for h1, h2, 
  specifiers?: string  
    // By default, appears inline to left of first element (preheading or heading) 
    // unless indicated otherwise in specifiers 
  icon?: Icon | string  // ReactNode or url string to asset
  iconSize?: number     // if url string, this sets the size
  preheading?: {
    text: string
    level?: number  // default: 4 
    mb?: number     // default: 2    
  }
  heading: {
    text: string
    level?: number  // default: 1
    mb?: number     // default: 2
  }
  byline?: {
    text: string
    level?: number  // default: 6
  }
}

export {
  type EnhHeadingBlock as default 
}