import type { Dimensions } from '../../types'
import type Block from './block'

// https://nextjs.org/docs/app/api-reference/components/image
interface ImageBlock extends Block {
  blockType: 'image'
  src: string      
  alt: string
  dim?:  Dimensions 
  fullWidthOnMobile?: boolean
  // cf: next/Image documentation, and type, as well as React.ImgHTMLAttributes
  props?: {
    sizes?: string
    fill?: boolean 
    objectFit?: string
    objectPosition?: string
  }
}

export {
  type ImageBlock as default,
}