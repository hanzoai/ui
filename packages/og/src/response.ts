import { ImageResponse } from 'next/og'
import type { OgConfig } from './types.js'
import { renderOgImage } from './render.js'

export function createOgImageResponse(config: OgConfig): ImageResponse {
  const w = config.width ?? 1200
  const h = config.height ?? 630
  return new ImageResponse(renderOgImage(config), { width: w, height: h })
}
