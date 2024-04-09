import type { AnimationDef, ImageDef, MediaStackDef, VideoDef } from '@hanzo/ui/types'

interface FamilyMediaData {
  img?: Record<string, ImageDef>
  video?: Record<string, VideoDef>
  anim?: Record<string, AnimationDef>
  optionImg?: Record<string, ImageDef> 
}

class ProductMediaAccessor {

  _data: FamilyMediaData

  constructor(data: FamilyMediaData) {
    this._data = data 
  }

  img = (key: string): ImageDef | undefined => (
    (this._data.img) ? this._data.img[key] : undefined
  )

  spreadableImg = (key: string): { img?: ImageDef } => (
    (this._data.img) ? {img: this._data.img[key]} : {}
  )

  video = (key: string): VideoDef | undefined => (
    (this._data.video) ? this._data.video[key] : undefined
  )

  spreadableVideo = (key: string): { video?: VideoDef } => (
    (this._data.video) ? {video: this._data.video[key]} : {}
  )

  anim = (key: string): AnimationDef | undefined => (
    (this._data.anim) ? this._data.anim[key] : undefined
  )

  spreadableAnim = (key: string): { animation?: AnimationDef } => (
    (this._data.anim) ? {animation: this._data.anim[key]} : {}
  )

  mediaStack = (key: string): MediaStackDef => ({
    ...this.spreadableImg(key),
    ...this.spreadableVideo(key),
    ...this.spreadableAnim(key)
  })
 

  optionImg = (key: string): ImageDef | undefined => (
    (this._data.optionImg) ? this._data.optionImg[key] : undefined
  )

  spreadableOptionImg = (key: string): { optionImg?: ImageDef } => {
    return (this._data.optionImg) ? { optionImg: this._data.optionImg[key]} : {}
  }
}

export default ProductMediaAccessor
