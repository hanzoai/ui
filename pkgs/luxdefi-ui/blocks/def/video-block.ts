import type { TShirtDimensions } from '../../types'
import type Block from './block'

interface VideoBlock extends Block {
  blockType: 'video'
  videoProps?: any   // For example,
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      videoProps: {
        autoPlay: true, 
        loop: true, 
        muted: true, 
        playsInline: true
      }, 

      Valueless props are boolean.  
      NOTE: Must be camalCase as per React conventions! (playsinline => playsInline)
    ~~~~~~~~~~~~~~~~~~~~~~~~ */

  poster?: string      
  sources?: string[]
  dim: TShirtDimensions 
    //  These are suppored so far: { vh: 60, mobile: {vw: 70} }
  sizing?: any
}

export {
  type VideoBlock as default,
}