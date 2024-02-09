import type { Dimensions } from '../../types'
import type Block from './block'

// https://nextjs.org/docs/app/api-reference/components/image
interface ImageBlock extends Block {
  blockType: 'image'
    // left (def) / right / center (must be in flex-col parent)
    // mobile-no-scale: default scales to 3/4 height on mobile and < md
  specifiers?: string
  src: string      
  alt: string
  dim?:  Dimensions 
  fullWidthOnMobile?: boolean
  // cf: next/Image documentation, and type, as well as React.ImgHTMLAttributes
  props?: {
    sizes?: string
    fill?: boolean  // if true, alignement specifiers are ignored
    style?: {
      objectFit?: string
      objectPosition?: string
      width?: number | string
      height?: number | string
    }
  }
}

export {
  type ImageBlock as default,
}