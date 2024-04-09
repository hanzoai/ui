import type AnimationDef from './animation-def'
import type ImageDef from './image-def'
import type VideoDef from './video-def'

interface MediaStackDef {
  img?: ImageDef
  video?: VideoDef
  animation?: AnimationDef
}

export { type MediaStackDef as default }