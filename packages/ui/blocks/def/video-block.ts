import type { VideoDef } from '../../types'

interface VideoBlock extends VideoDef {
  blockType: 'video'
}

export {
  type VideoBlock as default,
}