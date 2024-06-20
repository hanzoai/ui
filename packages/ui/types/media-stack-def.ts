import type AnimationDef from './animation-def'
import type ImageDef from './image-def'
import type VideoDef from './video-def'

  /** 
   * This will be implemented via css transforms, 
   * so will be a subset of those capabilities.
   * Individual transforms will be added as they 
   * are needed.
   */
interface MediaTransform {
    /** (X and Y) or [X, Y] */ 
  scale?: number | number[]  
}

interface MediaStackDef {
  img?: ImageDef
  video?: VideoDef
  animation?: AnimationDef
  mediaTransform?: MediaTransform
    /** prefered order of precedence.  
     * If an type is missing, it will not be used.
     * default (inMediaStack component): ['a', 'v', 'i']
     * */ 
  order?: ('a' | 'v' | 'i')[]  
}

export type { 
  MediaStackDef,
  MediaTransform  
}