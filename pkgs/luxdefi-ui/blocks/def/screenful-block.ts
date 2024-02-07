import type Block from './block'
import type VideoBlock from './video-block'

interface ScreenfulBlock extends Block {
  blockType: 'screenful'
    // Either an image URL, or a Video Block
    // 
    // If VideoBlock, then it's poster will be rendered server-side
    // and the <video> component will be lazy-loaded client-side.
    // 
    // If in a scrolling situation, the video will autoplay when 75% in view
  banner?: string | VideoBlock 
    // rendering and layout hints and variants

  specifiers?: string
    // columnSpecifiers apply to their corresponding column
  columnSpecifiers?: string[]

    // the order in the single column mobile layout in which the columns appear.
    // Use if wanting other than column order... eg, if wanting second tile of three first: [1, 0, 2]
  mobileOrder?: number[]

    // An array of 1-3 columns. 
    // Each an array blocks to be rendered vertically
    // If > 1, it will be enclosed in a 'grid grid-cols-<x>' div. 
  contentColumns: Block[][]
}

export {
  type ScreenfulBlock as default
}
