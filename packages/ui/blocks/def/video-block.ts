import type { VideoDef } from '../../types'

interface VideoBlock extends VideoDef {
  blockType: 'video'
  specifiers?: string
}

export {
  type VideoBlock as default,
}