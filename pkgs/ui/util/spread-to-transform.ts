import type { MediaTransform } from '../types'

export function spreadToTransform(t: MediaTransform) {
  let transformStrings: string[] = []
  const scaleVal = 'scale' in t ? t.scale : undefined
  if (scaleVal) {
    if (typeof scaleVal === 'number') {
      transformStrings.push(`scale(${scaleVal})`)
    }
    else if (
      Array.isArray(scaleVal) &&
      scaleVal.length == 2 &&
      typeof scaleVal[0] === 'number'
    ) {
      transformStrings.push(`scale(${scaleVal[0]}, ${scaleVal[1]})`)
    }
    else {
      throw new Error("parsing MediaTransform: Unrecognized value for 'scale'!")
    }
  }

  return transformStrings.length > 0 ? { transform: transformStrings.join(' ') } : {}
}

export default spreadToTransform