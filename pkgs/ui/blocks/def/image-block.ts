import type { ImageDef } from '../../types'
import type Block from './block'

  /**
   * See {@link ImageDef}
   * see https://nextjs.org/docs/app/api-reference/components/image
   * as well as React.ImgHTMLAttributes. 
   */
interface ImageBlock extends Block, ImageDef {
  blockType: 'image'

  /**
   * Alignement: 'left' (default) / 'right' / 'center' (must be in flex-col parent)
   * 'mobile-no-scale': By default, scales to 3/4 height (mobile and w < 'md')
   * 'mobile-full-width': Overrides dim, etc. and renders full width (maintaining aspect ratio)
   */
  specifiers?: string
    /** @deprecated Please use 'mobile-full-width' in specifiers  */
  fullWidthOnMobile?: boolean
    /** Next props */
  props?: {
    sizes?: string
      /** if true, any alignement specifiers are ignored */
    fill?: boolean  
    style?: any
  }
}

export {
  type ImageBlock as default,
}