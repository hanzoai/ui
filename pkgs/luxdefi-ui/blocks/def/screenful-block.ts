import type { ReactNode } from 'react'

import type Block from './block'
import type VideoBlock from './video-block'

  /**
   * A common screenful of content
   * An optional banner image or video
   * Content can be in columns
   */
interface ScreenfulBlock extends Block {
  blockType: 'screenful'


    /**
     * Either an image URL, or a Video Block
     * 
     * If VideoBlock, then it's poster will be rendered server-side
     * and the <video> component will be lazy-loaded client-side.
     * 
     * If in a scrolling situation, the video will autoplay when 75% in view
     */
  banner?: string | VideoBlock 
    
    /** Specifies rendering and layout hints and variants for block as a whole */ 
  specifiers?: string

    /** Specifies rendering and layout hints and variants for corresponding column */ 
  columnSpecifiers?: string[]

    /**
     * Mobile: The order in the single column mobile layout in which the columns appear.
     * Overrides column order.
     * eg, if you want the second tile of three at the top: [1, 0, 2] 
     */
  mobileOrder?: number[]

    /**
     * Content Blocks for 1-3 columns. 
     * (More than that is allowed, but impractical at many resolutions!) 
     * If > 1, it will be enclosed in a 'grid grid-cols-<x>' div. 
     */
  contentColumns: Block[][]

    /** optional footer element below the grid */
  footer?: ReactNode
}

export {
  type ScreenfulBlock as default
}
