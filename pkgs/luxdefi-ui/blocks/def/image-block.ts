import type { Dimensions } from '../../types'
import type Block from './block'

// https://nextjs.org/docs/app/api-reference/components/image
interface ImageBlock extends Block {
  blockType: 'image'
  src: string      
  dim?:  Dimensions 
    // cf: next/Image documentation, and type, as well as React.ImgHTMLAttributes
  props?: {
    sizes?: string
    alt?: string
    fill?: boolean 
    objectFit?: string
    objectPosition?: string
  }
}

export {
  type ImageBlock as default,
}